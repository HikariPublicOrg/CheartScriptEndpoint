# HttpServer API

端口: `8953`

## 接口列表

### GET /

返回服务器状态。

**响应**: `{ "status": "ok", "server": "Cheart HTTP Server" }`

---

### GET /health

返回客户端用户名和脚本目录。

**响应**: `{ "username": "玩家名", "script_dir": "脚本目录路径" }`

---

### GET /list-script

返回脚本目录下所有 `.bsh` 文件。

**响应**: `{ "scripts": ["file1.bsh", "file2.bsh"], "count": 2 }`

---

### GET /reload-script

触发脚本热重载（通过标志位在主线程执行 `script reload`）。

**响应**: `{ "ok": true, "message": "reload queued" }`

---

### GET /check-script

检查指定脚本文件是否存在。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 文件名，如 `HttpServer.bsh` |

**示例**: `GET /check-script?name=HttpServer.bsh`

**响应**: `{ "name": "HttpServer.bsh", "exists": true, "is_file": true }`

---

### GET /delete-script

删除指定脚本文件。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 文件名，如 `test.bsh` |

**示例**: `GET /delete-script?name=test.bsh`

**响应**: `{ "ok": true, "file": "test.bsh" }`

**错误**:
- `400` - 缺少 name 参数 / 不是文件
- `404` - 文件不存在

---

### GET /add-script

从 URL 下载脚本并保存到脚本目录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 脚本下载地址 |
| filename | string | 是 | 保存的文件名，必须以 `.bsh` 结尾 |

**示例**: `GET /add-script?url=https://example.com/test.bsh&filename=test.bsh`

**响应**: `{ "ok": true, "file": "test.bsh", "size": 1234 }`

**错误**:
- `400` - 缺少参数 / 文件名不以 `.bsh` 结尾
- `500` - 下载或保存失败
