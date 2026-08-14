# 图型示例合集

以下 10 种 Mermaid 图型可直接粘贴进 dsh 会话（插件会自动渲染），
或粘贴进 `demo/` 独立演示页体验。与 `demo/demo.js` 中的预设一一对应。

## 1. 流程图 flowchart

```mermaid
flowchart LR
    subgraph 人类侧
        Owner[责任人<br/>审核与问责]
    end

    subgraph 平台侧
        Launch[执行发起<br/>选择 Agent 类型 + 复制命令]
        Pass[Agent 通行证<br/>认证凭证]
        Track[状态与产出追踪]
    end

    subgraph Agent侧
        Agent[本地 Agent<br/>Claude Code / Codex]
        Run[认领并执行任务]
        Submit[提交任务产出]
    end

    Owner -->|选择 Agent 发起执行| Launch
    Agent -->|MCP 连接 + 通行证| Pass
    Launch --> Run
    Run --> Submit
    Submit --> Track
    Track -->|通知待审核| Owner
    Owner -->|通过 / 驳回| Track
```

## 2. 时序图 sequenceDiagram

```mermaid
sequenceDiagram
    participant O as 责任人
    participant P as 平台
    participant A as 本地 Agent
    O->>P: 选择 Agent 类型 + 复制命令
    P->>A: MCP 连接 + 通行证
    A->>P: 提交任务产出
    P-->>O: 通知待审核
    O-->>P: 通过 / 驳回
```

## 3. 类图 classDiagram

```mermaid
classDiagram
    class Task {
        +String id
        +String status
        +start()
        +submit()
    }
    class Agent {
        +String type
        +String pass
        +run(cmd)
    }
    class Owner {
        +review(task)
        +approve(task)
    }
    Task --> Agent : 认领执行
    Owner --> Task : 审核
```

## 4. 状态图 stateDiagram-v2

```mermaid
stateDiagram-v2
    [*] --> 待执行
    待执行 --> 执行中 : 认领
    执行中 --> 已提交 : 提交产出
    已提交 --> 审核中 : 通知责任人
    审核中 --> 已通过 : 通过
    审核中 --> 已驳回 : 驳回
    已驳回 --> 执行中 : 重新执行
    已通过 --> [*]
```

## 5. 甘特图 gantt

```mermaid
gantt
    title 任务交接周期
    dateFormat YYYY-MM-DD
    section 执行
    认领任务       :a1, 2024-01-01, 1d
    执行开发       :a2, after a1, 3d
    section 审核
    提交产出       :b1, after a2, 1d
    责任审核       :b2, after b1, 2d
```

## 6. 饼图 pie

```mermaid
pie title 任务类型占比
    "开发" : 40
    "测试" : 25
    "文档" : 20
    "运维" : 15
```

## 7. ER 图 erDiagram

```mermaid
erDiagram
    OWNER ||--o{ TASK : 审核
    TASK }o--|| AGENT : 认领
    TASK {
        string id PK
        string status
        string output
    }
    AGENT {
        string type
        string pass
    }
```

## 8. 旅程图 journey

```mermaid
journey
    title 一次任务交接
    section 发起
      选择 Agent: 5: 责任人
      复制命令: 4: 责任人
    section 执行
      认领执行: 3: Agent
      提交产出: 4: Agent
    section 审核
      通知审核: 3: 平台
      通过驳回: 5: 责任人
```

## 9. 思维导图 mindmap

```mermaid
mindmap
  root((任务交接))
    人类侧
      审核与问责
    平台侧
      执行发起
      Agent 通行证
      状态追踪
    Agent侧
      认领执行
      提交产出
```

## 10. Git 图 gitGraph

```mermaid
gitGraph
    commit id: "发起"
    branch agent
    checkout agent
    commit id: "执行"
    commit id: "提交产出"
    checkout main
    merge agent id: "审核通过"
```

## 11. 时间线 timeline

```mermaid
timeline
    title 任务交接时间线
    2024-01-01 : 发起执行
    2024-01-02 : Agent 认领
    2024-01-05 : 提交产出
    2024-01-07 : 审核通过
```
