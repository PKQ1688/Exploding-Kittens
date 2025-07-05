# 🔐 Ngrok 安全配置指南

## ⚠️ 重要安全提醒

**ngrok.yml 文件包含您的个人 authtoken，绝对不能提交到 git 仓库！**

## 🛠️ 配置步骤

### 1. 获取您的 ngrok authtoken

1. 访问 [ngrok.com](https://ngrok.com) 并登录
2. 进入 Dashboard
3. 复制您的 authtoken

### 2. 创建配置文件

```bash
# 复制模板文件
cp ngrok.yml.template ngrok.yml

# 编辑文件，替换 YOUR_NGROK_AUTHTOKEN_HERE 为您的真实 token
nano ngrok.yml
```

### 3. 验证配置

```bash
# 测试 ngrok 配置
ngrok config check
```

## 🔒 安全最佳实践

1. **永远不要**将包含真实 authtoken 的 ngrok.yml 提交到 git
2. **永远不要**在代码中硬编码 authtoken
3. **定期轮换**您的 authtoken
4. **使用环境变量**来存储敏感信息

## 📁 文件说明

- `ngrok.yml.template` - 安全的模板文件（可以提交到 git）
- `ngrok.yml` - 您的实际配置文件（已被 .gitignore 忽略）

## 🚨 如果 authtoken 泄露了怎么办？

1. 立即登录 ngrok.com
2. 重新生成新的 authtoken
3. 更新本地 ngrok.yml 文件
4. 撤销旧的 authtoken
