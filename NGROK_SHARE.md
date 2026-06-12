# ngrok 공유 방법

이 프로젝트는 정적 파일이라 로컬 서버 + `ngrok` 조합으로 바로 공유할 수 있습니다.

## 가장 중요한 주의

- 문서 맨 아래나 대화 중에 보이는 `https://...ngrok-free.dev` 주소는 **예시**일 수 있습니다.
- 그 주소를 직접 다시 입력해서 쓰는 것이 아니라, **내 터미널에서 ngrok를 실행했을 때 새로 출력되는 `Forwarding` 주소**를 복사해서 써야 합니다.
- `ERR_NGROK_334`가 나오면 대부분 **이미 같은 주소를 다른 ngrok 세션이 사용 중**이라는 뜻입니다.

## 1. 프로젝트 폴더로 이동

Windows PowerShell:

```powershell
cd D:\Strategy\color_jewel
```

## 2. 로컬 서버 실행

한 터미널에서 아래 명령을 실행한 뒤 그대로 켜 둡니다.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

정상이면 이런 식으로 보입니다.

```text
Serving HTTP on 127.0.0.1 port 8000 (http://127.0.0.1:8000/) ...
```

브라우저에서 먼저 이 주소가 열리는지 확인합니다.

```text
http://127.0.0.1:8000
```

## 3. 다른 터미널에서 ngrok 실행

서버를 실행한 터미널과 **다른 터미널**에서 실행합니다.

```powershell
ngrok http http://127.0.0.1:8000
```

정상이면 이런 식으로 보입니다.

```text
Forwarding  https://xxxxx.ngrok-free.dev -> http://127.0.0.1:8000
```

여기서 보이는 `https://xxxxx.ngrok-free.dev` 주소를 복사해서 공유하면 됩니다.

## 4. 자주 나는 오류

### `ERR_NGROK_334`

예:

```text
The endpoint "https://something.ngrok-free.dev" is already online
```

뜻:

- 같은 ngrok 주소를 이미 다른 세션이 사용 중입니다.

해결:

1. 예전 ngrok 터미널이 켜져 있으면 `Ctrl + C`로 종료합니다.
2. 예시 주소를 직접 입력하지 말고 다시 아래 명령만 실행합니다.

```powershell
ngrok http http://127.0.0.1:8000
```

3. 새로 출력된 `Forwarding` 주소를 사용합니다.

### `ERR_NGROK_8012`

뜻:

- ngrok는 열렸지만 로컬 `8000` 서버에 연결하지 못했습니다.

해결:

1. 브라우저에서 `http://127.0.0.1:8000` 이 열리는지 확인합니다.
2. 안 열리면 서버 터미널에서 다시 실행합니다.

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

3. 그다음 ngrok를 다시 실행합니다.

```powershell
ngrok http http://127.0.0.1:8000
```

## 5. 틀리기 쉬운 부분

- `python -m http.server 8000` 를 실행한 터미널은 끄면 안 됩니다.
- `ngrok`는 반드시 **다른 터미널**에서 실행해야 합니다.
- `https://...ngrok-free.dev` 예시 주소를 그대로 다시 쓰면 안 됩니다.
- 공유할 주소는 항상 **내가 방금 실행한 ngrok 터미널의 `Forwarding` 줄**에서 복사합니다.

## 6. 빠른 확인 순서

아래 2개가 모두 맞아야 공유가 됩니다.

1. 브라우저에서 `http://127.0.0.1:8000` 이 열린다.
2. ngrok 터미널에 `Forwarding https://...ngrok-free.dev -> http://127.0.0.1:8000` 이 보인다.

둘 중 하나라도 아니면 공유 주소는 동작하지 않습니다.
