# 로컬 LLM 결합 계획 (추후 구현)

> 픽셀아트 스테이지 스튜디오에 "LLM 호출" 소스를 실제로 연결하기 위한 설계 문서.
> 현재 `pixelart-studio.html`의 LLM 라디오 버튼은 `disabled` 상태이며,
> `generate()`에서 `toast("LLM 호출은 추후 구현 예정입니다")`로 막혀 있다.

## 1. 목표

사용자가 텍스트 프롬프트(또는 카테고리/키워드)를 입력하면 **로컬에서 구동되는
이미지 생성 모델**이 픽셀아트 이미지를 만들고, 그 결과가 기존 변환 파이프라인을
그대로 통과해 `14_shiba.json` 형식의 스테이지로 저장되도록 한다.

핵심 원칙: **기존 파이프라인을 재사용한다.** LLM은 "이미지 소스" 한 종류를 추가할
뿐이며, 생성된 이미지는 `auto`/`upload` 소스와 동일하게
`preprocess() → convert() → buildJSON()`을 거친다.

## 2. 현재 파이프라인 (재사용 대상)

```
소스 선택 → loadImage(src) → preprocess(img) → convert(img, W, H) → results[] → buildJSON()
```

| 단계 | 함수 | 역할 |
|------|------|------|
| 소스 목록 생성 | `buildAutoList()` / 업로드 핸들러 | `{src, cross, id, ko}` 배열 생성 |
| 이미지 로드 | `loadImage(src, cross)` | URL/dataURL → `Image` |
| 전처리 | `preprocess(img)` | 프레임 제거 · 자동 트림 |
| 변환 | `convert(img, W, H)` | 이미지 → `imageMap` + `palette` (median-cut 양자화) |
| 직렬화 | `buildJSON(item)` | shiba 스키마로 출력 |

LLM 소스는 이 중 **소스 목록 생성** 단계만 새로 만들면 되고, 나머지는 그대로 쓴다.
생성 모델이 dataURL(`data:image/png;base64,...`)을 반환하면 `loadImage`가
그대로 받아들이므로 `cross:false`로 처리하면 된다.

## 3. 로컬 LLM 후보

이미지를 만들어야 하므로 텍스트 LLM이 아니라 **로컬 이미지 생성 백엔드**가 필요하다.

| 방식 | 백엔드 | 비고 |
|------|--------|------|
| A. 로컬 확산 모델 (권장) | **ComfyUI** / **AUTOMATIC1111 (Stable Diffusion WebUI)** | 픽셀아트 LoRA + 작은 해상도(예: 64×64~128×128) 생성. REST API 제공 |
| B. 경량 로컬 서버 | **Ollama** + 이미지 모델 | 현재 Ollama는 이미지 생성보다 비전 입력에 강함. 보조용 |
| C. 텍스트 LLM 보조 | Ollama / llama.cpp | 이미지가 아니라 **프롬프트 보강·메타데이터(한글 이름, id) 생성** 용도 |

권장 구성: **A(이미지 생성) + C(메타데이터 생성)** 조합.
- A1111의 `--api` 모드: `POST http://127.0.0.1:7860/sdapi/v1/txt2img`
- ComfyUI: `POST http://127.0.0.1:8188/prompt` (워크플로 JSON) + `/history` 폴링

## 4. 구현 단계

### 4.1 UI (HTML/CSS)
- `pixelart-studio.html:84` 의 LLM 라디오에서 `disabled` 제거.
- `updateSourceUI()`(`:633`)에 `llm` 분기 추가 → `#llmOpts` 패널 표시.
- 신규 `#llmOpts` 패널 필드:
  - **엔드포인트 URL** (기본 `http://127.0.0.1:7860`)
  - **백엔드 종류** select: A1111 / ComfyUI
  - **프롬프트** textarea (예: `cute pixel art shiba dog, transparent background`)
  - **고정 프롬프트 접미사** (스타일 일관성: `pixel art, 1bit-ish, simple, centered`)
  - **개수**는 기존 `#count` 재사용
  - **시드 고정** 체크박스 (재현성)
  - 연결 테스트 버튼 + 상태 표시

### 4.2 클라이언트 호출 계층 (신규 JS)
`generate()`(`:578`)의 `if(src==="llm")` 가드를 실제 로직으로 교체.

```js
async function buildLlmList(count){
  const ep = els("llmEndpoint").value.trim();
  const backend = els("llmBackend").value;        // "a1111" | "comfyui"
  const prompt = els("llmPrompt").value.trim();
  const list = [];
  for(let i=0;i<count;i++){
    const dataUrl = await callLlmBackend(backend, ep, prompt, i); // PNG dataURL
    list.push({ src:dataUrl, cross:false, id:`llm-${i+1}`, ko:`생성 ${i+1}` });
  }
  return list;
}
```

`callLlmBackend()`는 백엔드별 어댑터:
- **A1111**: `fetch(ep+"/sdapi/v1/txt2img", {method:"POST", body:JSON.stringify({prompt, width:128, height:128, steps, ...})})`
  → 응답 `images[0]` 은 base64 → `"data:image/png;base64,"+b64`
- **ComfyUI**: 워크플로 템플릿에 프롬프트 주입 → `/prompt` 제출 → `/history/{id}` 폴링 → 출력 이미지 `/view` 다운로드 → blob → dataURL

생성된 dataURL은 기존 `loadImage → preprocess → convert` 를 그대로 탄다.
**`convert()`가 색 양자화(median-cut)와 팔레트 번호 매기기를 이미 처리**하므로
모델 출력이 깔끔한 픽셀아트가 아니어도 스테이지 형식으로 정규화된다.

### 4.3 메타데이터(이름/id) 보강 — 선택
텍스트 LLM(Ollama 등)으로 프롬프트에서 한글 이름(`ko`)과 영문 슬러그(`id`)를
생성. 실패 시 `llm-N` / `생성 N` 폴백.

### 4.4 에러 처리 · UX
- 백엔드 미연결 / CORS 차단 / 타임아웃 → toast로 안내, 진행바 중단.
- 로컬 서버 CORS: A1111은 `--cors-allow-origins=*`, ComfyUI는 `--enable-cors-header` 필요.
  HTML을 `file://`로 열면 CORS가 막힐 수 있으므로 **로컬 정적 서버로 서빙** 권장
  (예: `python3 -m http.server`).
- 생성은 느리므로 진행바(`#progress`)를 항목 단위로 갱신(기존 로직 재사용).

## 5. 데이터 흐름 (LLM 소스)

```
프롬프트 입력
   │
   ▼
callLlmBackend()  ──(REST)──▶  로컬 SD 서버 (A1111/ComfyUI)
   │                               │
   │        PNG base64 / blob      ▼
   ◀───────────────────────────────┘
   │
dataURL → loadImage → preprocess → convert(W,H) → results[] → buildJSON → ZIP export
```

## 6. 작업 체크리스트

- [ ] `#llmOpts` UI 패널 추가 (엔드포인트·백엔드·프롬프트·시드)
- [ ] LLM 라디오 `disabled` 제거 + `updateSourceUI()` 분기
- [ ] `callLlmBackend()` A1111 어댑터
- [ ] `callLlmBackend()` ComfyUI 어댑터
- [ ] `buildLlmList()` + `generate()` 가드 교체
- [ ] 연결 테스트 버튼 / 상태 표시
- [ ] (선택) 텍스트 LLM 메타데이터 보강
- [ ] CORS·타임아웃·실패 폴백 처리
- [ ] 로컬 서버 실행 안내 문서화

## 7. 미해결 / 결정 필요 사항 — 권장안

각 항목에 대한 권장 결론과 근거. (최종 결정은 5절 미해결 → 확정 시 본문 반영)

### 7.1 기본 백엔드: A1111 vs ComfyUI
**권장: A1111(Stable Diffusion WebUI)를 1차 지원, ComfyUI는 후순위 어댑터.**
- A1111의 `/sdapi/v1/txt2img`는 `{prompt, width, height, steps}` 단순 JSON 한 번으로
  base64 PNG를 바로 돌려준다. 폴링·노드 그래프가 없어 클라이언트 코드가 가장 짧다.
- ComfyUI는 워크플로 JSON 주입 → `/prompt` 제출 → `/history` 폴링 → `/view` 다운로드의
  다단계라 어댑터가 무거워, MVP에는 과하다. 워크플로 표현력이 필요해질 때 추가.
- 두 백엔드는 어댑터 인터페이스(`callLlmBackend(backend, ...)`)로 분리해
  나중에 ComfyUI를 끼워 넣어도 호출부는 그대로 두도록 설계한다.

### 7.2 생성 해상도
**권장: 모델은 256×256~512×512로 생성하고, 다운스케일은 기존 `convert()`에 맡긴다.**
- 확산 모델은 64×64 같은 초저해상도에서 형태가 깨지기 쉽다. 모델이 안정적으로
  잘 그리는 해상도로 뽑은 뒤, `convert()`의 median-cut 양자화로 프레임 크기에
  맞춰 정규화하는 편이 결과가 안정적이다.
- `convert()`가 이미 다운스케일·색 양자화·팔레트 번호 매기기를 모두 처리하므로
  파이프라인 일관성(`auto`/`upload` 소스와 동일 경로) 측면에서도 유리하다.
- 모델 단에서 프레임 크기로 바로 뽑으면 소스마다 분기가 생기고 픽셀 품질이 들쭉날쭉.

### 7.3 배포 형태 (CORS)
**권장: 경량 로컬 프록시 서버(Node 또는 Python) 도입.**
- `file://`로 연 HTML에서 로컬 SD 서버를 직접 `fetch`하면 CORS·혼합콘텐츠로 막히기 쉽고,
  사용자에게 백엔드 실행 플래그(`--cors-allow-origins`)까지 요구해 설정 부담이 크다.
- 프록시가 (a) 정적 HTML 서빙 (b) SD 백엔드 호출 중계 (c) CORS 헤더 처리를 모두 담당하면
  사용자는 서버 하나만 띄우면 된다. 동일 출처가 되어 보안 경고도 사라진다.
- 단일 HTML 철학을 유지하고 싶다면 차선책으로 "정적 서버로 서빙 + 백엔드 CORS 허용"을
  문서화하되, 설정 실패 문의가 늘 가능성이 높다.

### 7.4 픽셀아트 모델 / 프롬프트 프리셋
**권장: 픽셀아트 전용 LoRA + 고정 프롬프트 접미사 프리셋을 기본 제공.**
- 범용 SD 모델은 "픽셀아트"라고만 해도 안티에일리어싱된 그림을 내놓기 쉽다.
  픽셀아트 LoRA(예: pixel-art-xl 계열)를 얹고 `pixel art, simple, centered,
  transparent background, no text` 같은 접미사를 강제하면 후처리 부담이 준다.
- 사용자가 프롬프트 본문만 입력하고 스타일 접미사·네거티브 프롬프트는 프리셋으로
  고정 → 스테이지 간 톤 일관성 확보. 고급 사용자를 위해 접미사 편집은 열어둔다.

### 7.5 오프라인 보장
**권장: 완전 로컬(외부 API 호출 0)을 기본값으로 한다.**
- 이 프로젝트가 "로컬 LLM 결합"을 명시한 만큼, 외부 클라우드 의존은 취지에 어긋난다.
  모든 호출을 `127.0.0.1` 로컬 백엔드로 한정한다.
- 단, 현재 `auto` 소스가 OpenMoji/Twemoji CDN을 받아오는 점은 별개 기능이므로 유지하되,
  LLM 경로만큼은 네트워크 차단 환경에서도 동작하도록 보장한다.
- 텍스트 메타데이터 보강(4.3)도 외부 API 대신 로컬 Ollama로 처리해 오프라인 원칙을 지킨다.
