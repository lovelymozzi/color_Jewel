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
        const pendingPlaybackRequests = [];
        let bgmLoopTimer = null;
        let bgmLoopSequenceIndex = 0;
        let bgmOutputContext = null;
        let bgmOutputGain = null;
        let bgmSuspended = false;
        let buttonSoundPrimed = false;
        let stageClearCompleteSoundPrimed = false;
        let stageClearDimSoundPrimed = false;
        let stageClearParticleSoundPrimed = false;
        let activeStageClearCompleteAudio = null;
        const buttonSoundAssetSrc = "./src/assets/sounds/click1.wav";
        const stageClearCompleteSoundAssetSrc = "./src/assets/sounds/stage_clear1.wav";
        const stageClearDimSoundAssetSrc = "./src/assets/sounds/stage_clear_dim.wav";
        const stageClearParticleSoundAssetSrc = "./src/assets/sounds/stage_clear_particle.wav";
        const buttonSoundVolume = 0.04;
        const bgmLoopSoundVolume = 0.14;
        const stageClearCompleteSoundVolume = 0.18;
        const stageClearDimSoundVolume = 0.22;
        const stageClearParticleSoundVolume = 0.09;
        const BGM_PHRASE_MS = 3600;
        const BGM_OUTPUT_LEVEL = 1.18;
        const MAX_PENDING_PLAYBACK_REQUESTS = 8;
        const MAX_PENDING_PLAYBACK_AGE_MS = 1500;
        const BGM_SEQUENCE = [
            { root: 220, accent: 329.63 },
            { root: 246.94, accent: 369.99 },
            { root: 196, accent: 293.66 },
            { root: 174.61, accent: 261.63 }
        ];
        const BGM_LOOP_EVENTS = [
            { offsetMs: 0, durationMs: 920, frequencyKey: "root", multiplier: 1, endMultiplier: 1.01, level: 0.34 },
            { offsetMs: 220, durationMs: 500, frequencyKey: "accent", multiplier: 1, endMultiplier: 1.005, level: 0.2 },
            { offsetMs: 900, durationMs: 660, frequencyKey: "root", multiplier: 1.5, endMultiplier: 1.52, level: 0.23 },
            { offsetMs: 1460, durationMs: 420, frequencyKey: "accent", multiplier: 1, endMultiplier: 1.01, level: 0.17 },
            { offsetMs: 2040, durationMs: 840, frequencyKey: "root", multiplier: 0.75, endMultiplier: 0.752, level: 0.27 }
        ];
        const bgmLoopSoundAssetSrc = typeof Audio === "function"
            ? createFallbackToneSrc({
                durationMs: BGM_SEQUENCE.length * BGM_PHRASE_MS,
                volume: 0.9,
                sampleRate: 22050,
                renderSample: ({ index, sampleRate }) => {
                    const timeMs = (index / sampleRate) * 1000;
                    const phraseIndex = Math.floor(timeMs / BGM_PHRASE_MS) % BGM_SEQUENCE.length;
                    const phraseTimeMs = timeMs % BGM_PHRASE_MS;
                    const phrase = BGM_SEQUENCE[phraseIndex];
                    let mixedSample = 0;

                    BGM_LOOP_EVENTS.forEach(({ offsetMs, durationMs, frequencyKey, multiplier, endMultiplier, level }) => {
                        if (phraseTimeMs < offsetMs || phraseTimeMs > offsetMs + durationMs) {
                            return;
                        }

                        const noteElapsedMs = phraseTimeMs - offsetMs;
                        const noteProgress = Math.max(0, Math.min(1, noteElapsedMs / durationMs));
                        const attack = Math.min(1, noteProgress / 0.06);
                        const release = Math.min(1, (1 - noteProgress) / 0.18);
                        const envelope = Math.max(0, Math.min(1, attack, release));
                        const baseFrequency = phrase[frequencyKey] * multiplier;
                        const targetFrequency = phrase[frequencyKey] * endMultiplier;
                        const frequency = baseFrequency + (targetFrequency - baseFrequency) * noteProgress;
                        const phase = (2 * Math.PI * frequency * noteElapsedMs) / 1000;
                        mixedSample += Math.sin(phase) * level * envelope;
                    });

                    return Math.max(-1, Math.min(1, mixedSample * 0.85));
                }
            })
            : null;
        const buttonSoundTemplate = typeof Audio === "function" ? new Audio(buttonSoundAssetSrc) : null;
        const bgmLoopSoundTemplate = typeof Audio === "function" && bgmLoopSoundAssetSrc ? new Audio(bgmLoopSoundAssetSrc) : null;
        const stageClearCompleteSoundTemplate = typeof Audio === "function" ? new Audio(stageClearCompleteSoundAssetSrc) : null;
        const stageClearDimSoundTemplate = typeof Audio === "function" ? new Audio(stageClearDimSoundAssetSrc) : null;
        const stageClearParticleSoundTemplate = typeof Audio === "function" ? new Audio(stageClearParticleSoundAssetSrc) : null;
        if (buttonSoundTemplate) {
            buttonSoundTemplate.preload = "auto";
            buttonSoundTemplate.playsInline = true;
        }
        if (bgmLoopSoundTemplate) {
            bgmLoopSoundTemplate.preload = "auto";
            bgmLoopSoundTemplate.playsInline = true;
            bgmLoopSoundTemplate.loop = true;
        }
        if (stageClearCompleteSoundTemplate) {
            stageClearCompleteSoundTemplate.preload = "auto";
            stageClearCompleteSoundTemplate.playsInline = true;
        }
        if (stageClearDimSoundTemplate) {
            stageClearDimSoundTemplate.preload = "auto";
            stageClearDimSoundTemplate.playsInline = true;
        }
        if (stageClearParticleSoundTemplate) {
            stageClearParticleSoundTemplate.preload = "auto";
            stageClearParticleSoundTemplate.playsInline = true;
        }
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
            type = "sine",
            sampleRate = 22050,
            renderSample = null
        }) {
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
                let sample = 0;

                if (typeof renderSample === "function") {
                    sample = renderSample({
                        index,
                        progress,
                        frameCount,
                        sampleRate
                    });
                } else {
                    const attack = Math.min(1, progress / 0.08);
                    const release = Math.min(1, (1 - progress) / 0.22);
                    const envelope = Math.max(0.0001, Math.min(1, attack, release));
                    const phase = (2 * Math.PI * frequency * index) / sampleRate;
                    sample = Math.sin(phase);

                    if (type === "triangle") {
                        sample = (2 / Math.PI) * Math.asin(Math.sin(phase));
                    } else if (type === "square") {
                        sample = Math.sign(Math.sin(phase)) || 1;
                    }
                    sample *= envelope;
                }

                view.setInt16(44 + index * 2, Math.max(-32767, Math.min(32767, sample * amplitude)), true);
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
                playFallbackTone({ frequency: 860 + intensity * 36, durationMs: 90, volume: 0.48, type: "triangle" });
                return;
            }

            if (effectName === "place") {
                playFallbackTone({ frequency: 620 + intensity * 20, durationMs: 110, volume: 0.54, type: "triangle" });
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

            if (context.state === "interrupted" && document.visibilityState === "visible") {
                context = recreateAudioContext() || context;
            }

            if (context.state !== "running" && !audioFallbackUnlocked) {
                pendingPlaybackRequests.push({
                    playback,
                    queuedAt: Date.now()
                });
                if (pendingPlaybackRequests.length > MAX_PENDING_PLAYBACK_REQUESTS) {
                    pendingPlaybackRequests.splice(0, pendingPlaybackRequests.length - MAX_PENDING_PLAYBACK_REQUESTS);
                }
                return;
            }

            let played = false;
            let fallbackTimer = null;

            const runFallback = () => {
                if (played) {
                    return;
                }
                played = true;
                if (fallbackTimer) {
                    window.clearTimeout(fallbackTimer);
                    fallbackTimer = null;
                }
                fallback?.();
            };

            if (fallback) {
                fallbackTimer = window.setTimeout(runFallback, 96);
            }

            const runPlayback = (activeContext) => {
                if (played || !activeContext || activeContext.state !== "running") {
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

                            if (retryResume && typeof retryResume.then === "function") {
                                retryResume.then(() => {
                                    if (context.state === "running") {
                                        runPlayback(context);
                                        return;
                                    }
                                    runFallback();
                                }).catch(() => {
                                    runFallback();
                                });
                                return;
                            }

                            runFallback();
                        })
                        .catch(() => {
                            runFallback();
                        });
                    return;
                }

                context = recreateAudioContext();
                if (!context) {
                    runFallback();
                    return;
                }

                const retryResume = context.resume?.();
                if (context.state === "running") {
                    runPlayback(context);
                    return;
                }

                if (retryResume && typeof retryResume.then === "function") {
                    retryResume.then(() => {
                        if (context.state === "running") {
                            runPlayback(context);
                            return;
                        }
                        runFallback();
                    }).catch(() => {
                        runFallback();
                    });
                    return;
                }

                runFallback();
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
            if (bgmLoopSoundTemplate) {
                bgmLoopSoundTemplate.volume = Math.max(0, Math.min(1, bgmLoopSoundVolume * volumeMultiplier));
                if (!audioFallbackUnlocked || !AudioContextClass) {
                    if (shouldPlayBgm) {
                        if (!bgmLoopSoundTemplate.paused) {
                            return bgmEnabled;
                        }
                        if (!resumePlayback) {
                            bgmLoopSoundTemplate.currentTime = 0;
                        }
                        const playbackResult = bgmLoopSoundTemplate.play();
                        playbackResult?.catch?.((error) => {
                            console.warn("Failed to autoplay HTML BGM loop.", error);
                        });
                    } else {
                        bgmLoopSoundTemplate.pause();
                        if (!forceSuspend && !resumePlayback) {
                            bgmLoopSoundTemplate.currentTime = 0;
                        }
                    }
                    return bgmEnabled;
                }
                bgmLoopSoundTemplate.pause();
                bgmLoopSoundTemplate.currentTime = 0;
            }
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
            if (bgmLoopSoundTemplate && AudioContextClass) {
                bgmLoopSoundTemplate.pause();
                bgmLoopSoundTemplate.currentTime = 0;
                bgmLoopSoundTemplate.muted = false;
            }
            if (buttonSoundTemplate && !buttonSoundPrimed) {
                buttonSoundTemplate.muted = true;
                const buttonWarmupResult = buttonSoundTemplate.play();
                buttonWarmupResult?.then?.(() => {
                    buttonSoundTemplate.pause();
                    buttonSoundTemplate.currentTime = 0;
                    buttonSoundTemplate.muted = false;
                    buttonSoundPrimed = true;
                }).catch((error) => {
                    buttonSoundTemplate.pause();
                    buttonSoundTemplate.currentTime = 0;
                    buttonSoundTemplate.muted = false;
                    console.warn("Failed to warm button audio.", error);
                });
            }
            if (stageClearCompleteSoundTemplate && !stageClearCompleteSoundPrimed) {
                stageClearCompleteSoundTemplate.muted = true;
                const stageClearCompleteWarmupResult = stageClearCompleteSoundTemplate.play();
                stageClearCompleteWarmupResult?.then?.(() => {
                    stageClearCompleteSoundTemplate.pause();
                    stageClearCompleteSoundTemplate.currentTime = 0;
                    stageClearCompleteSoundTemplate.muted = false;
                    stageClearCompleteSoundPrimed = true;
                }).catch((error) => {
                    stageClearCompleteSoundTemplate.pause();
                    stageClearCompleteSoundTemplate.currentTime = 0;
                    stageClearCompleteSoundTemplate.muted = false;
                    console.warn("Failed to warm stage clear complete audio.", error);
                });
            }
            if (stageClearDimSoundTemplate && !stageClearDimSoundPrimed) {
                stageClearDimSoundTemplate.muted = true;
                const stageClearDimWarmupResult = stageClearDimSoundTemplate.play();
                stageClearDimWarmupResult?.then?.(() => {
                    stageClearDimSoundTemplate.pause();
                    stageClearDimSoundTemplate.currentTime = 0;
                    stageClearDimSoundTemplate.muted = false;
                    stageClearDimSoundPrimed = true;
                }).catch((error) => {
                    stageClearDimSoundTemplate.pause();
                    stageClearDimSoundTemplate.currentTime = 0;
                    stageClearDimSoundTemplate.muted = false;
                    console.warn("Failed to warm stage clear dim audio.", error);
                });
            }
            if (stageClearParticleSoundTemplate && !stageClearParticleSoundPrimed) {
                stageClearParticleSoundTemplate.muted = true;
                const stageClearParticleWarmupResult = stageClearParticleSoundTemplate.play();
                stageClearParticleWarmupResult?.then?.(() => {
                    stageClearParticleSoundTemplate.pause();
                    stageClearParticleSoundTemplate.currentTime = 0;
                    stageClearParticleSoundTemplate.muted = false;
                    stageClearParticleSoundPrimed = true;
                }).catch((error) => {
                    stageClearParticleSoundTemplate.pause();
                    stageClearParticleSoundTemplate.currentTime = 0;
                    stageClearParticleSoundTemplate.muted = false;
                    console.warn("Failed to warm stage clear particle audio.", error);
                });
            }
            requestAudioPlayback((context) => {
                if (pendingPlaybackRequests.length <= 0) {
                    return;
                }

                const queuedRequests = pendingPlaybackRequests.splice(0, pendingPlaybackRequests.length);
                const now = Date.now();
                queuedRequests.forEach(({ playback, queuedAt }) => {
                    if (now - queuedAt > MAX_PENDING_PLAYBACK_AGE_MS) {
                        return;
                    }
                    playback(context);
                });
            });
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
                    volume: 0.04 + accent * 0.003,
                    filterFrequency: 2400,
                    filterQ: 0.8
                });
                playTone(context, {
                    startTime: now + 0.018,
                    type: "sine",
                    startFrequency: 1440 + accent * 28,
                    endFrequency: 1760 + accent * 36,
                    duration: 0.08,
                    volume: 0.016 + accent * 0.0012,
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
                    volume: 0.015 + accent * 0.0012,
                    filterFrequency: 1600,
                    filterQ: 1.4
                });
                playTone(context, {
                    startTime: now,
                    type: "triangle",
                    startFrequency: 640 + accent * 18,
                    endFrequency: 430 + accent * 10,
                    duration: 0.1,
                    volume: 0.036 + accent * 0.0025,
                    filterFrequency: 1700,
                    filterQ: 1.1
                });
                playTone(context, {
                    startTime: now + 0.01,
                    type: "sine",
                    startFrequency: 520 + accent * 12,
                    endFrequency: 610 + accent * 16,
                    duration: 0.09,
                    volume: 0.013 + accent * 0.0012,
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
            if (buttonSoundTemplate) {
                const audio = buttonSoundTemplate.cloneNode();
                audio.volume = Math.max(0, Math.min(1, buttonSoundVolume * volumeMultiplier));
                const playbackResult = audio.play();
                playbackResult?.catch?.((error) => {
                    console.error("Failed to play click1.wav.", error);
                    requestAudioPlayback((context) => {
                        playButtonPressNow(context);
                    }, () => {
                        playFallbackEffect("button");
                    });
                });
                return;
            }
            requestAudioPlayback((context) => {
                playButtonPressNow(context);
            }, () => {
                playFallbackEffect("button");
            });
        }

        function playComplete(startDelayMs = 0, variant = "default") {
            if (!sfxEnabled) {
                return;
            }
            const completionSoundTemplate =
                variant === "stage_clear"
                        ? stageClearCompleteSoundTemplate
                        : variant === "stage_clear_dim"
                            ? stageClearDimSoundTemplate
                        : null;
            const completionSoundLabel =
                variant === "stage_clear"
                        ? "stage_clear1.wav"
                        : variant === "stage_clear_dim"
                            ? "stage_clear_dim.wav"
                        : "";
            const completionSoundVolume =
                variant === "stage_clear"
                        ? Math.max(0, Math.min(1, stageClearCompleteSoundVolume * volumeMultiplier))
                        : Math.max(0, Math.min(1, stageClearDimSoundVolume * volumeMultiplier));
            if (completionSoundTemplate) {
                if (startDelayMs > 0) {
                    window.setTimeout(() => {
                        if (!sfxEnabled) {
                            return;
                        }

                        const audio = completionSoundTemplate.cloneNode();
                        if (variant === "stage_clear_dim" && activeStageClearCompleteAudio) {
                            activeStageClearCompleteAudio.volume = Math.min(
                                activeStageClearCompleteAudio.volume,
                                Math.max(0, Math.min(1, 0.05 * volumeMultiplier))
                            );
                        }
                        audio.volume = completionSoundVolume;
                        if (variant === "stage_clear") {
                            activeStageClearCompleteAudio = audio;
                            audio.addEventListener("ended", () => {
                                if (activeStageClearCompleteAudio === audio) {
                                    activeStageClearCompleteAudio = null;
                                }
                            }, { once: true });
                        }
                        const playbackResult = audio.play();
                        playbackResult?.catch?.((error) => {
                            console.error(`Failed to play ${completionSoundLabel}`, error);
                            requestAudioPlayback((context) => {
                                const startTime = context.currentTime;
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
                                playFallbackEffect("complete");
                            });
                        });
                    }, startDelayMs);
                } else {
                    const audio = completionSoundTemplate.cloneNode();
                    if (variant === "stage_clear_dim" && activeStageClearCompleteAudio) {
                        activeStageClearCompleteAudio.volume = Math.min(
                            activeStageClearCompleteAudio.volume,
                            Math.max(0, Math.min(1, 0.05 * volumeMultiplier))
                        );
                    }
                    audio.volume = completionSoundVolume;
                    if (variant === "stage_clear") {
                        activeStageClearCompleteAudio = audio;
                        audio.addEventListener("ended", () => {
                            if (activeStageClearCompleteAudio === audio) {
                                activeStageClearCompleteAudio = null;
                            }
                        }, { once: true });
                    }
                    const playbackResult = audio.play();
                    playbackResult?.catch?.((error) => {
                        console.error(`Failed to play ${completionSoundLabel}`, error);
                        requestAudioPlayback((context) => {
                            const startTime = context.currentTime;
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
                            playFallbackEffect("complete");
                        });
                    });
                }
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
            if (stageClearParticleSoundTemplate) {
                const playStageClearParticle = () => {
                    if (!sfxEnabled) {
                        return;
                    }

                    const audio = stageClearParticleSoundTemplate.cloneNode();
                    audio.volume = Math.max(0, Math.min(1, stageClearParticleSoundVolume * volumeMultiplier));
                    const playbackResult = audio.play();
                    playbackResult?.catch?.((error) => {
                        console.error("Failed to play stage_clear_particle.wav.", error);
                        requestAudioPlayback((context) => {
                            const startTime = context.currentTime;
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
                            playFallbackEffect("firework", { startDelayMs: 0, accent });
                        });
                    });
                };

                if (startDelayMs > 0) {
                    window.setTimeout(playStageClearParticle, startDelayMs);
                } else {
                    playStageClearParticle();
                }
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
