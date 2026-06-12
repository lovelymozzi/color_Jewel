<!-- BEGIN: ui-editor scene-renderer guide (자동생성 — 이 마커 안쪽은 publish마다 갱신됩니다. 직접 수정 금지) -->

## UI 씬은 **ui-editor**로 제작됨 — 직접 재구현 금지

- 씬의 레이아웃·스타일·효과를 HTML/CSS로 다시 만들지 마세요. `*.contract.json` + `scene-renderer.js`에 이미 완성돼 있습니다.
- 씬과의 상호작용은 오직 `SceneRenderer` API로만. `scene-renderer.js`·`*.contract.json`은 **읽기 전용**(변경은 ui-editor에서 재 publish).
- 이벤트 이름·바인딩 키는 임의로 만들지 말고 `SCENES.md`의 값을 그대로 사용.

### 작업 규칙
- 시각적·브라우저 검증은 사용자가 직접 수행한다.
- 중복 함수 생성 금지 — 중복이 발견되면 공통 헬퍼 하나로 합친다.
- 신규 함수는 사용자의 허가를 받는다.
- 추정 금지 — 모호하면 사용자에게 질문하거나, 로그를 심어 오류를 직접 확인한다.
- 폴백·try/catch로 오류를 삼키지 않는다.

```js
import { SceneRenderer } from './scene-renderer.js';
const renderer = new SceneRenderer(document.body);
await renderer.load('./<scene>.contract.json');
renderer.update({ player: { coins: 1500 } }); // ★ show() 전에 호출 — 첫 페인트부터 실제값
renderer.show();
const off = renderer.on('<event_name>', (e) => {}); // 반환값 = 구독 해제
```

**API**: `load` / `loadSync` · `show` / `hide` · `on` / `off` · `update` · `getElement` / `getGroup` / `getTextElement`

### ⚠ 바인딩 값은 `show()` 전에 `update()`로 주입
- 바인딩 텍스트/이미지는 데이터가 없으면 contract에 저장된 **디폴트 literal**로 그려집니다.
- `show()` 후에 `update()`를 호출하면 디폴트값이 잠깐 보였다가 실제값으로 바뀌는 **플리커**가 생깁니다.
- 첫 렌더 데이터는 반드시 `show()` **이전에** `update(data)`로 넣으세요. (`update`는 `show` 전 호출분을 버퍼링해 첫 페인트에 반영합니다.)

### ⚠ 씬에 `hostedBy`가 있으면 단독으로 로드하지 말 것
- 일반 씬 contract에 `hostedBy` 배열이 있으면, 그 씬은 **단독이 아니라 navigation 씬 안에서 표시되도록 설계**된 것입니다.
- 이 경우 그 씬을 직접 `load` 하면 **네비게이션 바 없이** 씬만 나옵니다. 대신 `hostedBy[].navContract`(navigation contract)를 진입점으로 로드하세요 — navigation 씬이 탭을 통해 해당 씬을 내부에 마운트합니다.
- `hostedBy` 항목: `{ navScene, navContract, tabId, tabLabel }`.

### publish된 씬
- 씬 목록과 씬별 공개 인터페이스(이벤트·바인딩 키)는 [`./SCENES.md`](./SCENES.md) 참조.

<!-- END: ui-editor scene-renderer guide -->
