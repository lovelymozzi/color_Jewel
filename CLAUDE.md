<!-- BEGIN: ui-editor scene-renderer guide (자동생성 — 이 마커 안쪽은 publish마다 갱신됩니다. 직접 수정 금지) -->

## 🎨 이 폴더의 UI 씬은 **ui-editor**로 제작되었습니다 — 직접 재구현 금지

> 이 안내는 ui-editor가 publish 시 자동 생성합니다. **scene-renderer를 우회해 UI를 직접 구현하지 마세요.**

### ⛔ 반드시 지킬 것
1. 씬의 레이아웃·스타일·효과를 HTML/CSS로 다시 만들지 마세요. 이미 `*.contract.json` + `scene-renderer.js`에 완성돼 있습니다.
2. 게임 코드는 오직 `SceneRenderer` API를 통해서만 씬과 상호작용합니다 (아래 사용법).
3. `scene-renderer.js` 와 `*.contract.json` 은 ui-editor가 관리하며 **읽기 전용**으로 배포됩니다. 직접 편집하지 말고, 변경이 필요하면 ui-editor에서 다시 publish 하세요.
4. 이벤트 이름·바인딩 키는 아래 "publish된 씬" 목록의 값을 그대로 쓰세요. 임의로 만들지 마세요.

### 기본 사용법
```js
import { SceneRenderer } from './scene-renderer.js';

const renderer = new SceneRenderer(document.body); // 옵션: { basePath, autoLoadFonts, sceneRegistry, safeArea }
await renderer.load('./<scene>.contract.json'); // 또는 renderer.loadSync(contractObject)
renderer.show();

const off = renderer.on('<event_name>', (e) => { /* ... */ }); // 반환값은 구독 해제 함수
renderer.update({ player: { coins: 1500 } }); // 데이터 바인딩 갱신
renderer.hide();
```

**주요 API**: `load(url)` / `loadSync(obj)` · `show()` / `hide()` · `on(name, fn)` / `off(name, fn)` · `update(data)` · `getElement(stableId)` / `getGroup(name)` / `getTextElement(stableId, slot)`

### 이 폴더에 publish된 씬

<!-- SCENE:Color_Jewel BEGIN -->
#### `Color_Jewel`  ·  contract: `./Color_Jewel.contract.json`
- **이벤트** — `renderer.on(name, fn)` 으로만 연결 (이름 임의 생성 금지):
  - `item.wand`  (click)
  - `item.wand`  (click)
- **텍스트 바인딩** — `renderer.update({ ... })`: `item.clean`, `item.wand`
<!-- SCENE:Color_Jewel END -->

<!-- SCENE:New Scene BEGIN -->
#### `New Scene`  ·  contract: `./New Scene.contract.json`
- 이벤트: 없음
<!-- SCENE:New Scene END -->

<!-- SCENE:Stage_Clear BEGIN -->
#### `Stage_Clear`  ·  contract: `./Stage_Clear.contract.json`
- 이벤트: 없음
<!-- SCENE:Stage_Clear END -->

<!-- SCENE:setting BEGIN -->
#### `setting`  ·  contract: `./setting.contract.json`
- **이벤트** — `renderer.on(name, fn)` 으로만 연결 (이름 임의 생성 금지):
  - `re-start-115:click`  (click)
  - `re play`  (click)
<!-- SCENE:setting END -->

<!-- END: ui-editor scene-renderer guide -->
