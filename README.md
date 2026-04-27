# tachieasy

TRPG 立ち絵を **一括トリミング & タイリング** するブラウザ完結ツール。
単一 HTML ファイル / 外部送信ゼロ / GitHub Pages 配信。

公開: https://yyyyyyy0.github.io/tachieasy/

## できること

- 複数画像を読み込み、**同一の ROI で一括バストアップトリミング**
  - 比率モード（異サイズ画像 OK） / 絶対 px モード（同寸前提）
  - スマホ対応（Pointer Events によるドラッグ・リサイズ）
- トリミング結果を **任意の rows × cols グリッドでタイリング**
  - セル間隔・外側余白・fit / cover 切替
  - 背景：透過 / ColorPicker / `#RRGGBB` 直接入力
  - PNG（透過対応） / JPEG（品質指定）
- 個別 DL / タイル画像 DL

## プライバシー

すべての処理は **ブラウザ内で完結** します。画像データは外部に送信されません。
これは Content Security Policy `connect-src 'none'` により技術的に保証されています。

DevTools の Network パネルでオフラインにしてもすべての機能が動作することを確認できます。

## 使い方

1. ページを開く
2. 画像を選択（複数可）
3. サムネをクリックして参照画像を選び、ROI 矩形をドラッグして範囲決定
4. 「この範囲で全画像をトリミング」
5. グリッド設定（列数・背景色など）
6. 「プレビュー生成」→「タイル画像を DL」

## ローカルで動かす

```sh
git clone https://github.com/yyyyyyy0/tachieasy.git
cd tachieasy
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

`file://` でも動作しますが、一部ブラウザでは CSP の挙動が異なるため HTTP 配信を推奨します。

## ライセンス

MIT
