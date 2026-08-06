# Risk One

MGC・MNQ・MYMのEntry価格とStop Loss価格を入力し、1枚あたりの想定損失額を計算するPWAです。

## 起動
PWA・オフライン機能を使うには、HTTPS環境またはlocalhostで開いてください。

例:
python -m http.server 8080

その後:
http://localhost:8080

## 対応銘柄
- MGC: 1 point = $10.00 / tick 0.1 = $1.00
- MNQ: 1 point = $2.00 / tick 0.25 = $0.50
- MYM: 1 point = $0.50 / tick 1 = $0.50

手数料・スリッページは計算に含みません。
