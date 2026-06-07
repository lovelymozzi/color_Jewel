# ngrok 공유 방법

이 프로젝트는 정적 파일이라 간단한 로컬 서버 + `ngrok` 조합으로 바로 공유할 수 있습니다.

## 1. 프로젝트 폴더로 이동

```bash
cd /Users/al02501031/Documents/color_Jewel
```

## 2. 로컬 서버 실행

```bash
python3 -m http.server 8000
```

이 명령은 실행 후 계속 켜져 있어야 합니다.
한 번 실행되면 터미널이 점유되므로, 이 창은 그대로 두세요.

브라우저에서 아래 주소로 열 수 있습니다.

```text
http://127.0.0.1:8000
```

## 3. 새 터미널에서 ngrok 실행

반드시 다른 터미널 창이나 분할된 두 번째 터미널에서 실행하세요.

```bash
ngrok http 8000
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
Forwarding                    https://...ngrok-free.dev -> http://localhost:8000
```

이때 `Forwarding` 줄의 `https://...ngrok-free.dev` 주소를 복사해서 공유하면 됩니다.

## 5. 자주 생기는 실수

- 같은 터미널에 `python3 -m http.server 8000` 다음 줄로 `ngrok http 8000`까지 같이 치면 안 됩니다.
- `# 터미널 2` 같은 설명 문구를 그대로 입력하면 안 됩니다.
- 복붙 중 `~` 또는 `^[[200~` 같은 이상한 문자가 붙으면 명령이 깨질 수 있습니다.
- `ERR_NGROK_334`가 뜨면 이미 같은 ngrok 주소가 실행 중이라는 뜻입니다.

`ERR_NGROK_334`가 뜰 때는:

1. 이미 켜져 있는 기존 ngrok을 계속 사용하거나
2. 기존 ngrok를 `Ctrl + C`로 종료한 뒤 다시 `ngrok http 8000`을 실행하면 됩니다.

## 예시

이번 세션에서 생성된 예시 링크:

```text
https://unmelodically-nonproblematic-kaylene.ngrok-free.dev
```

주의:
- 이 링크는 `python3 -m http.server 8000` 서버가 실행 중이어야 접속됩니다.
- `ngrok`을 다시 실행하면 주소가 바뀔 수 있습니다.
- 공유를 끝내려면 서버 터미널과 ngrok 터미널에서 `Ctrl + C`를 누르면 됩니다.
