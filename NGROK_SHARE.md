# ngrok 공유 방법

이 프로젝트는 정적 파일이라 간단한 로컬 서버 + `ngrok` 조합으로 바로 공유할 수 있습니다.

## 1. 프로젝트 폴더로 이동

운영체제에 따라 프로젝트 경로만 다릅니다.

macOS:

```bash
cd /Users/al02501031/Documents/color_Jewel
```

Windows `cmd` / PowerShell 예시:

```bash
cd C:\Users\사용자이름\Documents\color_Jewel
```

## 2. 로컬 서버 실행

macOS:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows `cmd` / PowerShell:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

이 명령은 실행 후 계속 켜져 있어야 합니다.
한 번 실행되면 터미널이 점유되므로, 이 창은 그대로 두세요.

`--bind 127.0.0.1`를 붙이는 이유:

- macOS 환경에서는 `localhost`가 `::1`(IPv6)로 해석될 때가 있습니다.
- 이때 `ngrok`가 `localhost:8000` 대신 `::1:8000`로 연결을 시도하면 `ERR_NGROK_8012`가 날 수 있습니다.
- `127.0.0.1`로 고정하면 이 문제를 피할 수 있습니다.

브라우저에서 아래 주소로 열 수 있습니다.

```text
http://127.0.0.1:8000
```

## 3. 새 터미널에서 ngrok 실행

반드시 다른 터미널 창이나 분할된 두 번째 터미널에서 실행하세요.

macOS / Windows 공통:

```bash
ngrok http http://127.0.0.1:8000
```

실행되면 `https://...ngrok-free.dev` 형태의 공개 주소가 생성됩니다.
그 링크를 복사해서 다른 사용자에게 보내면 됩니다.

## 4. 성공 여부 확인

정상적으로 연결되면:

- 첫 번째 터미널에는 아래처럼 보입니다.

```text
Serving HTTP on ... port 8000 ...
```

- 두 번째 터미널에는 아래처럼 보입니다.

```text
Session Status                online
Forwarding                    https://...ngrok-free.dev -> http://127.0.0.1:8000
```

이때 `Forwarding` 줄의 `https://...ngrok-free.dev` 주소를 복사해서 공유하면 됩니다.

## 5. 자주 생기는 실수

- 같은 터미널에 `python3 -m http.server 8000 --bind 127.0.0.1` 다음 줄로 `ngrok http http://127.0.0.1:8000`까지 같이 치면 안 됩니다.
- `# 터미널 2` 같은 설명 문구를 그대로 입력하면 안 됩니다.
- 복붙 중 `~` 또는 `^[[200~` 같은 이상한 문자가 붙으면 명령이 깨질 수 있습니다.
- `ERR_NGROK_334`가 뜨면 이미 같은 ngrok 주소가 실행 중이라는 뜻입니다.
- 브라우저에서 `DNS_PROBE_FINISHED_NXDOMAIN`가 뜨면 `ngrok` 주소를 잘못 복사한 경우가 많습니다. `https://...ngrok-free.dev` 전체를 끝까지 다시 복사하세요.
- `ERR_NGROK_8012`가 뜨면 `ngrok` 자체는 살아 있지만, 로컬 `8000` 서버에 연결하지 못한 상태입니다.

`ERR_NGROK_334`가 뜰 때는:

1. 이미 켜져 있는 기존 ngrok을 계속 사용하거나
2. 기존 ngrok를 `Ctrl + C`로 종료한 뒤 다시 `ngrok http http://127.0.0.1:8000`을 실행하면 됩니다.

`ERR_NGROK_8012`가 뜰 때는:

1. 로컬 브라우저에서 `http://127.0.0.1:8000`이 먼저 열리는지 확인합니다.
2. 안 열리면 서버 터미널이 꺼졌거나, 처음부터 실행되지 않은 상태입니다.
3. 서버를 다시 실행합니다.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

4. 그다음 `ngrok`도 다시 실행합니다.

```bash
ngrok http http://127.0.0.1:8000
```

## 6. 빠른 점검 순서

아래 2개가 모두 만족되어야 외부 접속이 됩니다.

1. 내 브라우저에서 `http://127.0.0.1:8000`이 열린다.
2. `ngrok` 터미널의 `Forwarding`이 `https://...ngrok-free.dev -> http://127.0.0.1:8000`으로 보인다.

둘 중 하나라도 안 되면 공개 주소도 열리지 않습니다.

## 7. Windows에서 헷갈리기 쉬운 점

- `1번`의 폴더 경로만 macOS와 다르고, 나머지 흐름은 같습니다.
- Python 실행 명령은 환경에 따라 `python3` 대신 `python`을 쓰는 경우가 많습니다.
- `ngrok` 명령은 macOS와 동일하게 `ngrok http http://127.0.0.1:8000`을 쓰면 됩니다.
- 먼저 `http://127.0.0.1:8000`이 내 PC에서 열리는지 확인한 뒤 공유 링크를 보내세요.

## 예시

이번 세션에서 생성된 예시 링크:

```text
https://unmelodically-nonproblematic-kaylene.ngrok-free.dev
```

주의:
- 이 링크는 `python3 -m http.server 8000 --bind 127.0.0.1` 서버가 실행 중이어야 접속됩니다.
- `ngrok`을 다시 실행하면 주소가 바뀔 수 있습니다.
- 공유를 끝내려면 서버 터미널과 ngrok 터미널에서 `Ctrl + C`를 누르면 됩니다.
