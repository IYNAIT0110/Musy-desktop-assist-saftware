export const NATIVE_MESSAGES: readonly (readonly [string, string, string])[] = String.raw`
{name}\n{items} 条素材，{groups} 个分组，{covers} 张封面。\n外部引用原件不在备份中，恢复后可能需要重新关联根目录。\n当前资料将先保存在资料库 recovery 目录，原文件不会被移动或删除。|{name}\n{items} assets, {groups} groups, {covers} covers.\nReferenced originals are not included; you may need to relink source roots after restoring.\nThe current library is saved in its recovery folder first. Original files will not be moved or deleted.|{name}\n素材 {items} 件、グループ {groups} 個、表紙 {covers} 枚。\n参照元ファイルは含まれません。復元後に参照元ルートの再指定が必要な場合があります。\n現在の状態は先に recovery フォルダーへ保存します。元ファイルは移動・削除しません。
预览每次支持 1–60 项素材|Preview supports 1–60 assets at a time|一度にプレビューできる素材は1～60件です
请选择 2–4 张图片进行并排参考|Select 2–4 images to compare|比較する画像を2～4枚選択してください
请选中 1–60 个素材后拖出|Select 1–60 assets to drag out|ドラッグする素材を1～60件選択してください
请先从回收区恢复素材，再拖出使用|Restore assets from Trash before dragging them out|ごみ箱から素材を復元してからドラッグしてください
原文件缺失，请先重新定位：{name}|Original file missing; locate it first: {name}|元ファイルがありません。場所を指定し直してください：{name}
选择数据保存文件夹|Choose data folder|データ保存フォルダーを選択
选择语言包文件（JSON）|Choose language pack (JSON)|言語パックを選択（JSON）
JSON 语言包|JSON language pack|JSON 言語パック
导入 Musy 数据备份|Import Musy data backup|Musy のデータバックアップを読み込む
Musy JSON 备份|Musy JSON backup|Musy JSON バックアップ
导入提示词文件|Import scroll document|巻物の文書を読み込む
提示词文档|Prompt documents|プロンプト文書
部分图片不是内嵌图片或格式不受支持，未导入这些图片。|Some images were not embedded or use unsupported formats and were skipped.|埋め込みでない画像や未対応形式の画像はスキップしました。
文件超过 25 MB，请拆分后导入。|File exceeds 25 MB; split it before importing.|ファイルが 25 MB を超えています。分割して読み込んでください。
PDF 页面图像无法渲染，已仅根据可选中的文字识别。|PDF page images could not be rendered; only selectable text was analyzed.|PDF ページ画像を描画できないため、選択可能なテキストのみを解析しました。
PDF 参考图使用整页预览，可能包含页面文字。|PDF references use full-page previews and may include page text.|PDF の参照画像はページ全体のため、本文が含まれる場合があります。
PDF 只为前 20 页生成参考图，后续页仍会提取文字。|PDF reference images are generated for the first 20 pages; later pages still provide text.|PDF の参照画像は先頭20ページのみ生成します。以降もテキストは抽出します。
支持 DOCX、PDF、TXT、Markdown、HTML、CSV、JSON 和 RTF 文件。旧版 DOC 请先另存为 DOCX。|Supported: DOCX, PDF, TXT, Markdown, HTML, CSV, JSON and RTF. Save legacy DOC files as DOCX first.|DOCX・PDF・TXT・Markdown・HTML・CSV・JSON・RTF に対応。旧 DOC は DOCX に保存し直してください。
AI 返回的内容格式不正确，请重试。|The AI returned an invalid format; try again.|AI の応答形式が無効です。再試行してください。
请先在设置中配置 AI 模型和 API Key。|Configure an AI model and API key in Settings first.|先に設定で AI モデルと API キーを指定してください。
文件中没有可识别的文字。扫描版文件请先进行 OCR。|No readable text found. Run OCR on scanned files first.|認識できるテキストがありません。スキャン文書は先に OCR を実行してください。
文档较长，只分析前 70,000 个字符。|The document is long; only the first 70,000 characters were analyzed.|文書が長いため、先頭70,000文字のみを解析しました。
当前模型不支持图片输入，已根据文档文字与图片位置重新识别。|This model does not support images; text and image positions were used instead.|モデルが画像入力に非対応のため、文書のテキストと画像位置から再解析しました。
AI 未识别出带有三个标签的提示词，请检查文档内容或换用其他模型。|No prompts with three tags were found; check the document or use another model.|3つのタグ付きプロンプトを認識できませんでした。文書の内容やモデルを確認してください。
部分结果缺少三个有效标签，已跳过。|Some results lacked three valid tags and were skipped.|有効なタグが3つない結果をスキップしました。
资料库格式或版本不受支持|Unsupported library format or version|未対応のライブラリ形式・バージョンです
资料根目录记录无效|Invalid source root record|参照元ルートの記録が無効です
分组记录无效或重复|Invalid or duplicate group record|グループの記録が無効、または重複しています
素材记录无效：{name}|Invalid asset record: {name}|素材の記録が無効です：{name}
未知条目|Unknown entry|不明な項目
导入任务记录无效|Invalid import task record|取り込みタスクの記録が無効です
备份时间无效|Invalid backup timestamp|バックアップ日時が無効です
目录分组规则无效|Invalid folder grouping rule|フォルダーの分類ルールが無効です
索引文件超过 64 MB，已停止读取|Index exceeds 64 MB; reading stopped|索引が 64 MB を超えたため読み込みを停止しました
资料库目录不存在|Library folder does not exist|ライブラリフォルダーがありません
索引异常，已从上一份有效快照恢复；损坏文件已保留。|Index damaged; restored the last valid snapshot and kept the damaged file.|索引の異常を検出し、前回の正常な状態から復元しました。破損ファイルは保持しています。
索引超过当前 64 MB 上限，请分库管理|Index exceeds 64 MB; split assets across libraries|索引が上限の 64 MB を超えています。ライブラリを分けてください
素材不存在，请刷新列表|Asset not found; refresh the list|素材がありません。一覧を更新してください
文件路径无效|Invalid file path|ファイルパスが無効です
修改内容无效|Invalid changes|変更内容が無効です
请填写 1–300 字的显示名称|Enter a display name of 1–300 characters|表示名を1～300文字で入力してください
最多保存 100 个标签，每个不超过 80 字|Up to 100 tags, each at most 80 characters|タグは100個まで、各80文字以内です
分组名称为空、过长或已存在|Group name is empty, too long or already used|グループ名が空、長すぎる、または使用済みです
分组不存在|Group not found|グループがありません
分组操作无效|Invalid group action|グループ操作が無効です
根目录不存在|Source root not found|参照元ルートがありません
请选择一个文件|Select a file|ファイルを選択してください
新位置的文件类型与原条目不一致|The new file type does not match the original|新しいファイルの種類が元の項目と一致しません
素材不存在|Asset not found|素材がありません
已有导入任务，请等待或取消|An import is running; wait or cancel it|取り込み中です。完了を待つか中止してください
导入路径无效或数量过多|Import paths are invalid or too numerous|取り込みパスが無効、または件数が多すぎます
达到当前版本 100,000 条索引上限，请分库管理|The 100,000-item limit was reached; use another library|10万件の上限に達しました。ライブラリを分けてください
请先等待导入完成或取消导入，再备份|Wait for or cancel the import before backing up|取り込みの完了を待つか中止してからバックアップしてください
封面备份超过当前版本的体积上限，请分库管理|Cover backup exceeds the size limit; split libraries|表紙のバックアップがサイズ上限を超えています。ライブラリを分けてください
请先取消或完成导入|Cancel or finish the import first|先に取り込みを中止、または完了してください
不是百宝匣备份文件|This is not a Treasure Box backup|宝箱のバックアップファイルではありません
备份封面缺失或无效|Backup covers are missing or invalid|バックアップの表紙が欠落、または無効です
封面不是 PNG 图片|Cover is not a PNG image|表紙が PNG 画像ではありません
百宝匣位置配置损坏，请重新选择资料库|Library location settings are damaged; choose the library again|ライブラリの場所設定が破損しています。選択し直してください
资料库位置无效，请重新选择|Invalid library location; choose it again|ライブラリの場所が無効です。選択し直してください
资料库无法打开：{path}；{error}|Cannot open library: {path}; {error}|ライブラリを開けません：{path}；{error}
请先选择百宝匣资料库|Choose a Treasure Box library first|先に宝箱のライブラリを選択してください
素材选择无效|Invalid asset selection|素材の選択が無効です
请先完成或取消正在进行的任务|Finish or cancel the current task first|先に実行中のタスクを完了、または中止してください
选择资料库目录（首次会创建 Musy百宝匣 子目录）|Choose a library folder (creates a Musy百宝匣 subfolder on first use)|ライブラリを選択（初回は Musy百宝匣 サブフォルダーを作成）
正在切换资料库，请稍后|Switching libraries; please wait|ライブラリを切り替えています。お待ちください
导入本地素材（引用原件，不复制或移动文件）|Import local assets (reference originals; no files copied or moved)|ローカル素材を追加（元ファイルを参照し、コピー・移動はしません）
拖入的内容无效或图片超过 32 张|Invalid drop content or more than 32 images|ドロップ内容が無効、または画像が32枚を超えています
图片数据无效|Invalid image data|画像データが無効です
拖入图片总量超过 128 MB，请分批导入|Dropped images exceed 128 MB; import in batches|画像の合計が 128 MB を超えています。分けて追加してください
无法解码拖入的图片，请先保存为图片文件再导入|Cannot decode the dropped image; save it to a file first|画像を読み取れません。画像ファイルに保存してから追加してください
图片像素过大，请先保存为文件再导入|Image dimensions are too large; save to a file first|画像の画素数が多すぎます。ファイルに保存してから追加してください
图片总量过大，请先保存为文件再分批导入|Images are too large; save to files and import in batches|画像の合計サイズが大きすぎます。ファイルに保存して分けて追加してください
请拖入本地文件或图片，网页链接请用传送门收藏|Drop local files or images; save web links in Portals|ローカルのファイル・画像をドロップしてください。URL はポータルに保存できます
文件不存在或磁盘未连接，请重新定位|File missing or drive disconnected; locate the file again|ファイルがないかドライブが未接続です。場所を指定し直してください
打开操作无效|Invalid open action|開く操作が無効です
此类型请通过“所在位置”在系统中打开|Use Show in folder to open this file type in the system|この種類は「保存場所を表示」からシステムで開いてください
无法打开，请检查默认应用：{error}|Cannot open; check the default application: {error}|開けません。既定のアプリを確認してください：{error}
选择原资料根目录的新位置（保留其下的相对目录结构）|Choose the source root's new location (keep relative subfolder paths)|参照元ルートの新しい場所を選択（配下の相対構造を保持）
重新定位：{name}|Locate file: {name}|場所を再指定：{name}
选择素材封面|Choose asset cover|素材の表紙を選択
无法读取这张图片，请换一张|Cannot read this image; choose another|画像を読み込めません。別の画像を選択してください
备份索引与自有封面（外部引用原件不包含）|Back up index and covers (referenced originals excluded)|索引と表紙をバックアップ（参照元ファイルは含みません）
百宝匣备份|Treasure Box backup|宝箱バックアップ
备份超过当前 256 MB 上限，请减少封面或分库管理|Backup exceeds 256 MB; reduce covers or split libraries|バックアップが 256 MB を超えています。表紙を減らすかライブラリを分けてください
请先完成或取消导入|Finish or cancel the import first|先に取り込みを完了、または中止してください
选择百宝匣备份或恢复点|Choose a Treasure Box backup or recovery point|宝箱のバックアップ・復元ポイントを選択
备份文件超过 256 MB 上限|Backup file exceeds 256 MB|バックアップが 256 MB の上限を超えています
备份格式不支持|Unsupported backup format|未対応のバックアップ形式です
恢复备份|Restore backup|バックアップを復元
恢复将替换当前百宝匣索引|Restoring replaces the current Treasure Box index|復元すると現在の宝箱の索引が置き換わります
不支持的百宝匣操作|Unsupported Treasure Box action|未対応の宝箱操作です
剪贴板中没有可导入的文件或图片。请先复制文件、文件夹、绝对路径，或截取图片。|No files or images to import. Copy files, folders, absolute paths or a screenshot first.|追加できるファイル・画像がありません。ファイル・フォルダー・絶対パス・スクリーンショットをコピーしてください。
剪贴板图片超过 128 MB，请先保存为文件再导入|Clipboard image exceeds 128 MB; save it to a file first|クリップボード画像が 128 MB を超えています。ファイルに保存してから追加してください
`.trim().split('\n').map(line => {
  const [zh, en, ja] = line.split('|').map(value => value.replace(/\\n/g, '\n'))
  return [zh, en, ja] as const
})
