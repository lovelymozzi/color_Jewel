(function () {
    "use strict";

    function createColorJewelSoundController(options = {}) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const volumeMultiplier = Number(options.volumeMultiplier || 1);
        let sfxEnabled = options.sfxEnabled !== false;
        let bgmEnabled = options.bgmEnabled !== false;
        let audioContext = null;
        let audioNoiseBuffer = null;
        let audioFallbackUnlocked = false;
        const audioFallbackCache = new Map();
        let bgmLoopTimer = null;
        let bgmLoopSequenceIndex = 0;
        let bgmOutputContext = null;
        let bgmOutputGain = null;
        let bgmSuspended = false;

        const BGM_PHRASE_MS = 3600;
        const BGM_OUTPUT_LEVEL = 1.18;
        const BGM_SEQUENCE = [
            { root: 220, accent: 329.63 },
            { root: 246.94, accent: 369.99 },
            { root: 196, accent: 293.66 },
            { root: 174.61, accent: 261.63 }
        ];

        function getAudioContext() {
            if (!AudioContextClass) return null;
            if (!audioContext || audioContext.state === "closed") {
                audioContext = new AudioContextClass();
                audioNoiseBuffer = null;
            }
            return audioContext;
        }

        function recreateAudioContext() {
            if (!AudioContextClass) {
                return null;
            }

            try {
                audioContext?.close?.();
            } catch (error) {}

            audioContext = new AudioContextClass();
            audioNoiseBuffer = null;
            return audioContext;
        }

        function clearBgmLoopTimer() {
            if (bgmLoopTimer) {
                window.clearTimeout(bgmLoopTimer);
                bgmLoopTimer = null;
            }
        }

        function ensureBgmOutput(context) {
            if (!context) {
                return null;
            }

            if (bgmOutputGain && bgmOutputContext === context) {
                return bgmOutputGain;
            }

            bgmOutputGain?.disconnect?.();
            bgmOutputContext = context;
            bgmOutputGain = context.createGain();
            bgmOutputGain.gain.setValueAtTime(bgmEnabled && !bgmSuspended ? BGM_OUTPUT_LEVEL : 0.0001, context.currentTime);
            bgmOutputGain.connect(context.destination);
            return bgmOutputGain;
        }

        function getNoiseBuffer(context) {
            if (audioNoiseBuffer) return audioNoiseBuffer;

            const length = Math.floor(context.sampleRate * 0.12);
            const buffer = context.createBuffer(1, length, context.sampleRate);
            const channel = buffer.getChannelData(0);

            for (let index = 0; index < length; index += 1) {
                channel[index] = Math.random() * 2 - 1;
            }

            audioNoiseBuffer = buffer;
            return audioNoiseBuffer;
        }

        function buildFallbackToneKey({
            frequency = 440,
            durationMs = 120,
            volume = 0.35,
            type = "sine"
        }) {
            return `${type}:${frequency}:${durationMs}:${volume}`;
        }

        function createFallbackToneSrc({
            frequency = 440,
            durationMs = 120,
            volume = 0.35,
            type = "sine"
        }) {
            const sampleRate = 22050;
            const frameCount = Math.max(1, Math.floor(sampleRate * (durationMs / 1000)));
            const pcmBytes = new Uint8Array(44 + frameCount * 2);
            const view = new DataView(pcmBytes.buffer);
            const amplitude = Math.max(0, Math.min(1, volume)) * 32767 * 0.9;

            const writeString = (offset, value) => {
                for (let index = 0; index < value.length; index += 1) {
                    view.setUint8(offset + index, value.charCodeAt(index));
                }
            };

            writeString(0, "RIFF");
            view.setUint32(4, 36 + frameCount * 2, true);
            writeString(8, "WAVE");
            writeString(12, "fmt ");
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true);
            view.setUint16(34, 16, true);
            writeString(36, "data");
            view.setUint32(40, frameCount * 2, true);

            for (let index = 0; index < frameCount; index += 1) {
                const progress = index / frameCount;
                const attack = Math.min(1, progress / 0.08);
                const release = Math.min(1, (1 - progress) / 0.22);
                const envelope = Math.max(0.0001, Math.min(1, attack, release));
                const phase = (2 * Math.PI * frequency * index) / sampleRate;
                let sample = Math.sin(phase);

                if (type === "triangle") {
                    sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
                } else if (type === "square") {
                    sample = Math.sign(Math.sin(phase)) || 1;
                }

                view.setInt16(44 + index * 2, Math.max(-32767, Math.min(32767, sample * amplitude * envelope)), true);
            }

            let binary = "";
            pcmBytes.forEach((byte) => {
                binary += String.fromCharCode(byte);
            });
            return `data:audio/wav;base64,${btoa(binary)}`;
        }

        function playFallbackTone(spec, delayMs = 0) {
            if (typeof Audio === "undefined" || !audioFallbackUnlocked) {
                return;
            }

            const startPlayback = () => {
                const key = buildFallbackToneKey(spec);
                const src = audioFallbackCache.get(key) || createFallbackToneSrc(spec);
                audioFallbackCache.set(key, src);

                try {
                    const audio = new Audio(src);
                    audio.volume = 1;
                    audio.play().catch(() => {});
                } catch (error) {}
            };

            if (delayMs > 0) {
                window.setTimeout(startPlayback, delayMs);
                return;
            }

            startPlayback();
        }

        function playFallbackEffect(effectName, options = {}) {
            const { clusterSize = 1, startDelayMs = 0, accent = 0 } = options;
            const intensity = Math.min(clusterSize, 4);

            if (effectName === "button") {
                playFallbackTone({ frequency: 760, durationMs: 80, volume: 0.34, type: "sine" });
                return;
            }

            if (effectName === "pickup") {
                playFallbackTone({ frequency: 860 + intensity * 36, durationMs: 90, volume: 0.38, type: "triangle" });
                return;
            }

            if (effectName === "place") {
                playFallbackTone({ frequency: 620 + intensity * 20, durationMs: 110, volume: 0.42, type: "triangle" });
                return;
            }

            if (effectName === "complete") {
                [880, 1174, 1568, 2093].forEach((frequency, index) => {
                    playFallbackTone(
                        { frequency, durationMs: 120, volume: 0.32, type: "sine" },
                        startDelayMs + index * 72
                    );
                });
                return;
            }

            if (effectName === "firework") {
                playFallbackTone({ frequency: 220 + accent * 14, durationMs: 180, volume: 0.34, type: "triangle" }, startDelayMs);
                playFallbackTone({ frequency: 960 + accent * 38, durationMs: 90, volume: 0.24, type: "square" }, startDelayMs + 110);
            }
        }

        function requestAudioPlayback(playback, fallback = null) {
            let context = getAudioContext();
            if (!context) {
                fallback?.();
                return;
            }

            let played = false;
            let fallbackTimer = null;

            const runFallback = () => {
                if (played) {
                    return;
                }
                fallback?.();
            };

            if (fallback) {
                fallbackTimer = window.setTimeout(runFallback, 96);
            }

            const runPlayback = (activeContext) => {
                if (!activeContext || activeContext.state !== "running") {
                    return;
                }

                played = true;
                if (fallbackTimer) {
                    window.clearTimeout(fallbackTimer);
                    fallbackTimer = null;
                }
                playback(activeContext);
            };

            if (context.state === "running") {
                runPlayback(context);
                return;
            }

            try {
                const resumeResult = context.resume?.();
                if (context.state === "running") {
                    runPlayback(context);
                    return;
                }

                if (resumeResult && typeof resumeResult.then === "function") {
                    resumeResult
                        .then(() => {
                            if (context.state === "running") {
                                runPlayback(context);
                                return;
                            }

                            context = recreateAudioContext();
                            if (!context) {
                                return;
                            }

                            const retryResume = context.resume?.();
                            if (context.state === "running") {
                                runPlayback(context);
                                return;
                            }

                            retryResume?.then(() => {
                                runPlayback(context);
                            }).catch(() => {
                                runFallback();
                            });
                        })
                        .catch(() => {
                            runFallback();
                        });
                }
            } catch (error) {
                runFallback();
            }
        }

        function playBgmPhrase(context, phraseIndex = 0) {
            const phrase = BGM_SEQUENCE[phraseIndex % BGM_SEQUENCE.length];
            const startTime = context.currentTime + 0.02;
            const bgmDestination = ensureBgmOutput(context) || context.destination;
            const progression = [
                { offset: 0.0, frequency: phrase.root, duration: 0.92, volume: 0.0048 },
                { offset: 0.22, frequency: phrase.accent, duration: 0.5, volume: 0.0028 },
                { offset: 0.9, frequency: phrase.root * 1.5, duration: 0.66, volume: 0.0032 },
                { offset: 1.46, frequency: phrase.accent, duration: 0.42, volume: 0.0024 },
                { offset: 2.04, frequency: phrase.root * 0.75, duration: 0.84, volume: 0.0038 }
            ];

            progression.forEach(({ offset, frequency, duration, volume }) => {
                playTone(context, {
                    startTime: startTime + offset,
                    type: "sine",
                    startFrequency: frequency,
                    endFrequency: frequency * 1.01,
                    duration,
                    volume,
                    attack: 0.02,
                    filterType: "lowpass",
                    filterFrequency: 920,
                    filterQ: 0.24,
                    destination: bgmDestination
                });
            });
        }

        function scheduleNextBgmPhrase(delayMs = BGM_PHRASE_MS) {
            clearBgmLoopTimer();
            if (!bgmEnabled || bgmSuspended) {
                return;
            }

            bgmLoopTimer = window.setTimeout(() => {
                bgmLoopTimer = null;
                if (!bgmEnabled || bgmSuspended) {
                    return;
                }

                requestAudioPlayback((context) => {
                    playBgmPhrase(context, bgmLoopSequenceIndex);
                    bgmLoopSequenceIndex = (bgmLoopSequenceIndex + 1) % BGM_SEQUENCE.length;
                    scheduleNextBgmPhrase();
                });
            }, Math.max(0, delayMs));
        }

        function setSfxEnabled(nextValue) {
            sfxEnabled = nextValue !== false;
            return sfxEnabled;
        }

        function setBgmEnabled(nextValue, options = {}) {
            const { forceSuspend = false, resumePlayback = false } = options;
            bgmEnabled = nextValue !== false;
            if (!bgmEnabled) {
                bgmSuspended = false;
            } else if (forceSuspend) {
                bgmSuspended = true;
            } else if (resumePlayback) {
                bgmSuspended = false;
            }
            const shouldPlayBgm = bgmEnabled && !bgmSuspended;
            if (bgmOutputGain && bgmOutputContext) {
                const now = bgmOutputContext.currentTime;
                const currentValue = Math.max(0.0001, Number(bgmOutputGain.gain.value || 0.0001));
                bgmOutputGain.gain.cancelScheduledValues(now);
                bgmOutputGain.gain.setValueAtTime(currentValue, now);
                bgmOutputGain.gain.linearRampToValueAtTime(shouldPlayBgm ? BGM_OUTPUT_LEVEL : 0.0001, now + 0.08);
            }
            if (shouldPlayBgm) {
                scheduleNextBgmPhrase(0);
            } else {
                clearBgmLoopTimer();
            }
            return bgmEnabled;
        }

        function isSfxEnabled() {
            return sfxEnabled;
        }

        function isBgmEnabled() {
            return bgmEnabled;
        }

        function playTone(context, options) {
            const {
                startTime = context.currentTime,
                type = "sine",
                startFrequency,
                endFrequency = startFrequency,
                duration = 0.1,
                volume = 0.03,
                attack = 0.003,
                filterType = "lowpass",
                filterFrequency = 1800,
                filterQ = 0.9,
                destination = context.destination
            } = options;
            const oscillator = context.createOscillator();
            const filter = context.createBiquadFilter();
            const gain = context.createGain();
            const endTime = startTime + duration;

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(startFrequency, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), endTime);

            filter.type = filterType;
            filter.frequency.setValueAtTime(filterFrequency, startTime);
            filter.Q.setValueAtTime(filterQ, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(volume * volumeMultiplier, startTime + attack);
            gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

            oscillator.connect(filter);
            filter.connect(gain);
            gain.connect(destination);

            oscillator.onended = () => {
                oscillator.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
            oscillator.start(startTime);
            oscillator.stop(endTime + 0.02);
        }

        function playNoiseBurst(context, options) {
            const {
                startTime = context.currentTime,
                duration = 0.05,
                volume = 0.012,
                filterType = "bandpass",
                filterFrequency = 1800,
                filterQ = 1.2,
                destination = context.destination
            } = options;
            const source = context.createBufferSource();
            const filter = context.createBiquadFilter();
            const gain = context.createGain();
            const endTime = startTime + duration;

            source.buffer = getNoiseBuffer(context);

            filter.type = filterType;
            filter.frequency.setValueAtTime(filterFrequency, startTime);
            filter.Q.setValueAtTime(filterQ, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.exponentialRampToValueAtTime(volume * volumeMultiplier, startTime + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(destination);

            source.onended = () => {
                source.disconnect();
                filter.disconnect();
                gain.disconnect();
            };
            source.start(startTime);
            source.stop(endTime + 0.01);
        }

        function warmup() {
            audioFallbackUnlocked = true;
            requestAudioPlayback(() => {});
            if (bgmEnabled && !bgmSuspended && !bgmLoopTimer) {
                scheduleNextBgmPhrase(0);
            }
        }

        function playPickup(clusterSize = 1) {
            if (!sfxEnabled) {
                return;
            }
            requestAudioPlayback((context) => {
                const now = context.currentTime;
                const accent = Math.min(clusterSize, 4);

                playTone(context, {
                    startTime: now,
                    type: "triangle",
                    startFrequency: 760 + accent * 24,
                    endFrequency: 1180 + accent * 30,
                    duration: 0.11,
                    volume: 0.028 + accent * 0.002,
                    filterFrequency: 2400,
                    filterQ: 0.8
                });
                playTone(context, {
                    startTime: now + 0.018,
                    type: "sine",
                    startFrequency: 1440 + accent * 28,
                    endFrequency: 1760 + accent * 36,
                    duration: 0.08,
                    volume: 0.011 + accent * 0.001,
                    filterFrequency: 3200,
                    filterQ: 0.6
                });
            }, () => {
                playFallbackEffect("pickup", { clusterSize });
            });
        }

        function playPlace(clusterSize = 1) {
            if (!sfxEnabled) {
                return;
            }
            requestAudioPlayback((context) => {
                const now = context.currentTime;
                const accent = Math.min(clusterSize, 4);

                playNoiseBurst(context, {
                    startTime: now,
                    duration: 0.045,
                    volume: 0.011 + accent * 0.001,
                    filterFrequency: 1600,
                    filterQ: 1.4
                });
                playTone(context, {
                    startTime: now,
                    type: "triangle",
                    startFrequency: 640 + accent * 18,
                    endFrequency: 430 + accent * 10,
                    duration: 0.1,
                    volume: 0.026 + accent * 0.002,
                    filterFrequency: 1700,
                    filterQ: 1.1
                });
                playTone(context, {
                    startTime: now + 0.01,
                    type: "sine",
                    startFrequency: 520 + accent * 12,
                    endFrequency: 610 + accent * 16,
                    duration: 0.09,
                    volume: 0.009 + accent * 0.001,
                    filterFrequency: 2200,
                    filterQ: 0.7
                });
            }, () => {
                playFallbackEffect("place", { clusterSize });
            });
        }

        function playButtonPressNow(context) {
            const now = context.currentTime;

            playNoiseBurst(context, {
                startTime: now,
                duration: 0.018,
                volume: 0.0022,
                filterType: "bandpass",
                filterFrequency: 1450,
                filterQ: 0.55
            });
            playTone(context, {
                startTime: now,
                type: "sine",
                startFrequency: 640,
                endFrequency: 980,
                duration: 0.07,
                volume: 0.017,
                filterFrequency: 2400,
                filterQ: 0.42
            });
            playTone(context, {
                startTime: now + 0.018,
                type: "sine",
                startFrequency: 1180,
                endFrequency: 1560,
                duration: 0.06,
                volume: 0.011,
                filterFrequency: 3200,
                filterQ: 0.38
            });
            playTone(context, {
                startTime: now + 0.01,
                type: "sine",
                startFrequency: 720,
                endFrequency: 520,
                duration: 0.12,
                volume: 0.0045,
                filterFrequency: 1800,
                filterQ: 0.48
            });
        }

        function playButton() {
            if (!sfxEnabled) {
                return;
            }
            requestAudioPlayback((context) => {
                playButtonPressNow(context);
            }, () => {
                playFallbackEffect("button");
            });
        }

        function playComplete(startDelayMs = 0) {
            if (!sfxEnabled) {
                return;
            }
            requestAudioPlayback((context) => {
                const startTime = context.currentTime + startDelayMs / 1000;
                const notes = [880, 1174, 1568, 2093];

                playNoiseBurst(context, {
                    startTime,
                    duration: 0.08,
                    volume: 0.005,
                    filterFrequency: 2600,
                    filterQ: 1.8
                });

                notes.forEach((frequency, index) => {
                    const noteTime = startTime + index * 0.072;
                    playTone(context, {
                        startTime: noteTime,
                        type: "triangle",
                        startFrequency: frequency,
                        endFrequency: frequency * 1.04,
                        duration: 0.24,
                        volume: 0.015 + index * 0.0015,
                        filterFrequency: 3200,
                        filterQ: 0.7
                    });
                    playTone(context, {
                        startTime: noteTime + 0.012,
                        type: "sine",
                        startFrequency: frequency * 1.5,
                        endFrequency: frequency * 1.62,
                        duration: 0.18,
                        volume: 0.008,
                        filterFrequency: 4200,
                        filterQ: 0.5
                    });
                });
            }, () => {
                playFallbackEffect("complete", { startDelayMs });
            });
        }

        function playFirework(startDelayMs = 0, accent = 0) {
            if (!sfxEnabled) {
                return;
            }
            requestAudioPlayback((context) => {
                const startTime = context.currentTime + startDelayMs / 1000;
                const liftPitch = 210 + accent * 18;
                const boomPitch = 92 + accent * 6;
                const crackPitch = 1240 + accent * 58;

                playNoiseBurst(context, {
                    startTime,
                    duration: 0.11,
                    volume: 0.006,
                    filterType: "highpass",
                    filterFrequency: 1400 + accent * 80,
                    filterQ: 0.8
                });
                playTone(context, {
                    startTime,
                    type: "triangle",
                    startFrequency: liftPitch,
                    endFrequency: liftPitch * 2.8,
                    duration: 0.14,
                    volume: 0.008,
                    filterFrequency: 2200,
                    filterQ: 0.9
                });

                playNoiseBurst(context, {
                    startTime: startTime + 0.13,
                    duration: 0.16,
                    volume: 0.017 + accent * 0.0016,
                    filterType: "bandpass",
                    filterFrequency: 1700 + accent * 120,
                    filterQ: 0.7
                });

                playTone(context, {
                    startTime: startTime + 0.128,
                    type: "sine",
                    startFrequency: boomPitch,
                    endFrequency: Math.max(44, boomPitch * 0.48),
                    duration: 0.34,
                    volume: 0.03 + accent * 0.002,
                    filterType: "lowpass",
                    filterFrequency: 320,
                    filterQ: 0.5
                });

                playTone(context, {
                    startTime: startTime + 0.138,
                    type: "triangle",
                    startFrequency: boomPitch * 1.9,
                    endFrequency: boomPitch * 0.92,
                    duration: 0.22,
                    volume: 0.016 + accent * 0.001,
                    filterType: "lowpass",
                    filterFrequency: 780,
                    filterQ: 0.7
                });

                playNoiseBurst(context, {
                    startTime: startTime + 0.17,
                    duration: 0.08,
                    volume: 0.014 + accent * 0.0012,
                    filterType: "highpass",
                    filterFrequency: 3000 + accent * 160,
                    filterQ: 0.8
                });

                playNoiseBurst(context, {
                    startTime: startTime + 0.24,
                    duration: 0.06,
                    volume: 0.010 + accent * 0.0008,
                    filterType: "bandpass",
                    filterFrequency: 2200 + accent * 120,
                    filterQ: 1.1
                });

                playNoiseBurst(context, {
                    startTime: startTime + 0.31,
                    duration: 0.05,
                    volume: 0.008 + accent * 0.0007,
                    filterType: "bandpass",
                    filterFrequency: 2800 + accent * 140,
                    filterQ: 1.2
                });

                playTone(context, {
                    startTime: startTime + 0.155,
                    type: "sawtooth",
                    startFrequency: crackPitch,
                    endFrequency: crackPitch * 0.54,
                    duration: 0.18,
                    volume: 0.012 + accent * 0.0013,
                    filterType: "highpass",
                    filterFrequency: 2400,
                    filterQ: 0.8
                });

                playTone(context, {
                    startTime: startTime + 0.205,
                    type: "square",
                    startFrequency: crackPitch * 1.26,
                    endFrequency: crackPitch * 0.74,
                    duration: 0.12,
                    volume: 0.0048 + accent * 0.0007,
                    filterType: "highpass",
                    filterFrequency: 3200,
                    filterQ: 0.5
                });
            }, () => {
                playFallbackEffect("firework", { startDelayMs, accent });
            });
        }

        return {
            warmup,
            setSfxEnabled,
            setBgmEnabled,
            isSfxEnabled,
            isBgmEnabled,
            playPickup,
            playPlace,
            playButton,
            playComplete,
            playFirework
        };
    }

    window.ColorJewelSound = {
        createController: createColorJewelSoundController
    };
})();
