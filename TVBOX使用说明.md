# TVBox 订阅说明

本仓库除了输出 MoonTV / LunaTV 的 Base58 订阅（`*.txt`）之外，还会自动把同一份配置转换成 **TVBox 系客户端**可直接使用的 `sites` 格式。

转换由 `to_tvbox.js` 完成，在 `JSON Build, API Check & Encoding` 工作流中自动运行。

## 一、订阅链接

把下面的链接填进客户端的「配置地址」即可：

| 版本 | 说明 | 链接 |
| --- | --- | --- |
| 完整版 | 全部源，含成人源 | `https://raw.githubusercontent.com/DeleteHR/LunaTV-config/refs/heads/main/tvbox.json` |
| 精简+成人版 | 去掉带 `_comment` 的项，保留成人源 | `https://raw.githubusercontent.com/DeleteHR/LunaTV-config/refs/heads/main/tvbox-jingjian.json` |
| 精简版 | 再去掉成人源 | `https://raw.githubusercontent.com/DeleteHR/LunaTV-config/refs/heads/main/tvbox-jin18.json` |

国内直连 `raw.githubusercontent.com` 通常不通，改用 jsDelivr：

```
https://cdn.jsdelivr.net/gh/DeleteHR/LunaTV-config@main/tvbox.json
https://cdn.jsdelivr.net/gh/DeleteHR/LunaTV-config@main/tvbox-jingjian.json
https://cdn.jsdelivr.net/gh/DeleteHR/LunaTV-config@main/tvbox-jin18.json
```

jsDelivr 有约 12 小时缓存。刚更新完想立刻生效，把 `@main` 换成具体 commit 的 SHA。

## 二、客户端怎么填

- **TVBox / CatVodTVBox / 影视仓**：设置 → 配置地址，粘贴上面的链接。
- **OK影视**：首页右上角 → 配置 → 新增，粘贴链接。
- 部分客户端只接受 `.json` 结尾的地址，本仓库的链接正好符合。

## 三、配置结构

输出是标准的 TVBox 单源清单：

```json
{
  "sites": [
    {
      "key": "iqiyizyapi_com",
      "name": "🎬-爱奇艺-",
      "type": 1,
      "api": "https://iqiyizyapi.com/api.php/provide/vod",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 0
    }
  ]
}
```

字段说明：

- `type: 1` —— 这些源全是苹果 CMS V10 的 JSON 接口（`/api.php/provide/vod`），因此**不需要 spider jar**，纯接口源即可播放。
- `key` —— 由原配置的域名 key 净化而来（`.`、`-` 等替换为 `_`），并做了去重，保证在客户端里唯一。
- `searchable` / `quickSearch` —— 置 1，允许首页聚合搜索和快速搜索。
- `filterable` —— 置 0，因为这类接口不提供分类筛选参数。
- `adult: 1` —— 仅出现在名称含 🔞 的源上，方便部分客户端做过滤。

## 四、怎么更新

改 `LunaTV-config.json` 即可，三种方式任选：

1. **网页改**：点开 `LunaTV-config.json` → 铅笔图标 → 在 `api_site` 里增删条目 → Commit changes。
2. **本地改**：克隆仓库后改完 push。
3. **走上游**：如果只是跟随上游源更新，点仓库首页的 **Sync fork** 按钮。

因为工作流的 push 触发器监听了 `LunaTV-config.json`，只要这个文件有提交，`jingjian.json`、`jin18.json`、三个 `.txt` 和三个 `tvbox*.json` 都会在同一次运行里重新生成并提交回来。

### 筛选规则

- 某条源里带 `"_comment"` 字段 → **不进** `jingjian` / `tvbox-jingjian`（也就是被标记为"需要手工确认/可选的源"）。
- 源名称以 `🔞` 开头 → **不进** `jin18` / `tvbox-jin18`。

## 五、常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| 客户端提示"配置格式错误" | 用的是 `.txt`（Base58）链接。TVBox 系客户端要的是 `tvbox*.json` |
| 拉不到配置 | 走 jsDelivr 链接；国内 raw 域名基本不通 |
| 改完配置没变化 | jsDelivr 缓存，把 `@main` 换成 commit SHA，或稍等 |
| 频道都在但搜不到 | 少数接口不支持搜索，`quickSearch` 已开但接口本身无搜索能力 |
| 上游更新后我的源没了 | 自动同步（Fork-sync）把分支拉回上游了，见下方注意事项 |

## 六、注意事项

本仓库自带一个 `Fork-sync.yml` 工作流，每天自动把上游 `hafrey1/LunaTV-config` 的提交同步过来。本仓库相比上游多了 `to_tvbox.js` 和 TVBox 输出，属于**主动分叉**：

- 新增文件（`to_tvbox.js`）不会被同步覆盖；
- 但如果上游也修改了 `.github/workflows/build-check-encode.yml`，同步会因冲突而失败。

如果你不需要跟随上游自动更新，建议在 **Actions** 页面把这个工作流 Disable，改成需要时手动点 **Sync fork**。
