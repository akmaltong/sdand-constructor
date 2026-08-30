# Demo setup — Sdand Constructor

Локальный запуск для показа заказчикам. Работает одинаково на Windows и Mac. Первый раз ~10 минут, потом одна команда.

## Первый запуск

### 1. Установи Bun и Git LFS

**Windows** (PowerShell от админа):
```powershell
irm bun.sh/install.ps1 | iex
winget install -e --id GitHub.GitLFS
```

**Mac** (Terminal):
```bash
curl -fsSL https://bun.sh/install | bash
brew install git-lfs
```

Перезапусти терминал после установки.

### 2. Клонируй репу с LFS-файлами

```bash
git clone https://github.com/akmaltong/sdand-constructor.git
cd sdand-constructor/sdand-constructor
git lfs install
git lfs pull
```

### 3. Установи зависимости

```bash
bun install
```

## Запуск для демо

```bash
cd sdand-constructor/sdand-constructor
bun run dev
```

Открывай **http://localhost:3002** — конструктор загрузился.

Останов: Ctrl+C в терминале.

## Обновить с гита (когда я запушу новые правки)

```bash
cd sdand-constructor/sdand-constructor
git pull
git lfs pull
bun install
bun run dev
```

## Если что-то сломалось

- **Порт 3002 занят**: закрой другой bun/node процесс или перезагрузи комп.
- **`bun: command not found`** после установки: перезапусти терминал, проверь `bun --version`.
- **Модели/стенды не грузятся, только серые кубы**: не сделал `git lfs pull` — сделай, потом снова `bun run dev`.
- **Экран зависает при импорте GLB**: не должен, DRACO wasm лежит локально в `apps/editor/public/draco/`. Если всё же — Reset в правом верхнем.

## Как показывать заказчику

- Ноут + проектор/большой экран. Работает через Chrome, Safari, Edge (WebGPU нужен).
- Мобильный тест: открой http://<IP-ноута>:3002 с телефона в той же Wi-Fi. Найти IP: Windows `ipconfig`, Mac `ifconfig | grep inet`.
