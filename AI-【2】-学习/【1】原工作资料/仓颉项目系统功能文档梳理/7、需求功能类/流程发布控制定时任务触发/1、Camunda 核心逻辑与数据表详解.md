# Camunda BPMN 核心逻辑与数据表详解

## 一、Camunda 数据表体系

### 1.1 表分类概览

Camunda 的数据表分为四大类：

#### **ACT_RE_* (Repository)** - 流程定义和部署
- **ACT_RE_PROCDEF**: 流程定义表
- **ACT_RE_DEPLOYMENT**: 部署记录表
- **ACT_RE_MODEL**: 流程模型表

#### **ACT_RU_* (Runtime)** - 运行时数据
- **ACT_RU_EXECUTION**: 流程执行实例
- **ACT_RU_TASK**: 用户任务表
- **ACT_RU_JOB**: 作业表（定时任务）
- **ACT_RU_TIMER**: 定时器表
- **ACT_RU_VARIABLE**: 流程变量表

#### **ACT_HI_* (History)** - 历史数据
- **ACT_HI_PROCINST**: 历史流程实例
- **ACT_HI_ACTINST**: 历史活动实例
- **ACT_HI_TASKINST**: 历史任务实例
- **ACT_HI_JOB_LOG**: 历史作业日志

#### **ACT_GE_* (General)** - 通用数据
- **ACT_GE_BYTEARRAY**: 二进制数据表（存储 BPMN 文件等）
- **ACT_GE_PROPERTY**: 属性表

---

## 二、核心表结构详解

### 2.1 ACT_RE_PROCDEF - 流程定义表

**作用**：存储 Camunda 引擎中已部署的流程定义信息

**关键字段**：
```sql
ID_                 -- 流程定义 ID（主键）
KEY_                -- 流程定义 KEY（对应 BPMN 中的 process id）
VERSION_            -- 版本号（从 1 开始递增）
DEPLOYMENT_ID_      -- 部署 ID（关联 ACT_RE_DEPLOYMENT）
RESOURCE_NAME_      -- BPMN 文件资源名称
SUSPENSION_STATE_   -- 暂停状态（1=活动，2=已暂停）
```

**实际数据示例**（来自您的查询）：
```
ID_: changdongtest1:1:d14de977-2d6b-11f0-b24c-00ff0512147b
KEY_: changdongtest1
VERSION_: 1
DEPLOYMENT_ID_: d14de977-2d6b-11f0-b24c-00ff0512147b
RESOURCE_NAME_: diagram_2.bpmn
SUSPENSION_STATE_: 1  (活动状态)
```

**重要特性**：
1. **KEY_ + VERSION_ 唯一性**：同一个 KEY 的版本号从 1 开始递增
2. **SUSPENSION_STATE_**：
   - `1` = 活动状态（可执行）
   - `2` = 已暂停（不可执行新实例）
3. **ID_ 格式**：`KEY_:VERSION_:UUID`

---

### 2.2 ACT_RE_DEPLOYMENT - 部署记录表

**作用**：记录每次流程部署的信息

**关键字段**：
```sql
ID_          -- 部署 ID（主键）
NAME_        -- 部署名称（自定义，如 "NLP_应用 ID"）
DEPLOY_TIME_ -- 部署时间
SOURCE_      -- 部署来源
TENANT_ID_   -- 租户 ID
```

**实际数据示例**：
```
ID_: 805762665422929285
NAME_: NLP_805760277769239685
DEPLOY_TIME_: 2026-03-23 13:53:11.783
SOURCE_: [NULL]
TENANT_ID_: [NULL]
```

**部署流程**：
```java
// 代码调用示例
DeployVO deployVO = repositoryService.createDeployment()
    .addStringInputStream("process.bpmn", bpmnInputStream)
    .name("NLP_" + appId)
    .deploy();
```

**重要特性**：
1. 每次部署生成一条记录
2. 一个部署可以包含多个流程定义（多个 BPMN 文件）
3. 部署后会自动在 ACT_RE_PROCDEF 中生成流程定义记录

---

### 2.3 ACT_RU_JOB - 运行时作业表

**作用**：存储当前待执行的作业（包括定时任务、异步任务）

**关键字段**：
```sql
ID_                -- 作业 ID
TYPE_              -- 作业类型（message, timer, signal 等）
PROCESS_DEF_ID_    -- 流程定义 ID
PROCESS_INSTANCE_ID_ -- 流程实例 ID
EXECUTION_ID_      -- 执行 ID
RETRIES_           -- 重试次数
DUEDATE_           -- 到期时间
LOCK_OWNER_        -- 锁持有者
LOCK_EXP_TIME_     -- 锁过期时间
SUSPENSION_STATE_  -- 暂停状态（true=已暂停，false=活动）
```

**您的数据情况**：
- 最新数据：2025-06-09（去年）
- 当前时间：2026-03-23
- **结论**：已经 9 个多月没有新的作业记录

**作业类型**：
1. **timer**：定时事件触发
2. **message**：消息事件触发
3. **signal**：信号事件触发
4. **async**：异步任务

---

### 2.4 ACT_RU_TIMER - 定时器表

**作用**：专门存储 Timer Event 的定时任务

**关键字段**：
```sql
ID_                -- 定时器 ID
TYPE_              -- 定时器类型（TIME, CYCLE, DATE）
PROCESS_DEF_ID_    -- 流程定义 ID
EXECUTION_ID_      -- 执行 ID
DUEDATE_           -- 到期时间
RETRIES_           -- 重试次数
SUSPENSION_STATE_  -- 暂停状态
```

**Timer Event 类型**：
1. **Timer Start Event**：定时启动流程
2. **Timer Boundary Event**：边界定时器（超时处理）
3. **Timer Intermediate Event**：中间定时器

---

### 2.5 ACT_HI_JOB_LOG - 历史作业日志表

**作用**：记录所有已完成的作业执行历史

**关键字段**：
```sql
ID_                -- 日志 ID
PROCESS_DEF_ID_    -- 流程定义 ID
PROCESS_DEF_KEY_   -- 流程定义 KEY
JOB_STATE_         -- 作业状态（SUCCESS, FAILED, CANCELED）
RETRIES_           -- 重试次数
DUEDATE_           -- 到期时间
CREATE_TIME_       -- 创建时间
REMOVAL_TIME_      -- 移除时间（清理策略）
```

**您的数据情况**：
- **表中没有任何记录**
- **说明**：
  - 从来没有定时任务执行过
  - 或者历史日志被清理策略删除了
  - 或者流程中根本没有 Timer Event

---

### 2.6 bpm_proc_def - 业务表流程定义

**作用**：项目自定义的流程定义表，用于扩展 Camunda 的功能

**关键字段**：
```sql
id                 -- 主键 ID
proc_def_id        -- Camunda 流程定义 ID（关联 ACT_RE_PROCDEF.ID_）
model_code         -- 流程模型编码
model_name         -- 流程模型名称
version            -- 版本号
deploy_id          -- 部署 ID
model_json         -- 流程配置 JSON（前端设计器数据）
model_xml          -- BPMN XML 内容
create_time        -- 创建时间
```

**实际数据示例**：
```
proc_def_id: process_804380352604671621:17:805762665620061573
model_code: process_804380352604671621
version: 17
```

**与 Camunda 原生表的区别**：
1. **Camunda 的 ACT_RE_PROCDEF**：引擎内部使用，存储标准 BPMN 流程定义
2. **业务的 bpm_proc_def**：业务扩展，存储前端设计器的配置和版本管理

---

### 2.7 agent_workflow_config - 应用工作流配置表

**作用**：存储应用的工作流配置信息

**关键字段**：
```sql
id                 -- 主键 ID
define_id          -- 流程定义 ID（完整格式：KEY:VERSION:UUID）
bpmn               -- BPMN XML 内容
config             -- 流程配置 JSON（前端设计器数据）
app_id             -- 关联的应用 ID（通过 agent_app_version 关联）
```

**实际数据示例**：
```
id: 805757680735894533
define_id: process_804380352604671621:17:805762665620061573
bpmn: <?xml version="1.0" encoding="UTF-8"?>...
config: {"nodes":[...], "edges":[...]}
app_id: 805760277769239685
```

**重要关系**：
```
agent_app_base (应用基础表)
    ↓
agent_app_version (应用版本表)
    ↓ workflow_config_id
agent_workflow_config (工作流配置表)
    ↓ define_id
Camunda ACT_RE_PROCDEF (流程定义表)
```

---

## 三、核心业务流程

### 3.1 应用发布流程

#### **步骤 1：用户点击"发布为应用"**

```
前端请求 → AgentAppBaseController.publish(appId)
```

#### **步骤 2：构建服务处理发布逻辑**

```java
// AgentAppBaseServiceImpl.publish()
public void publish(String appId, String status) {
    if ("1".equals(status)) {
        // 发布操作
        // 1. 查询当前应用版本
        AgentAppVersionEntity currentVersion = agentAppVersionService
            .getCurrentVersion(appId);
        
        // 2. 获取工作流配置
        AgentWorkflowConfigEntity workflowConfig = agentWorkflowConfigService
            .getById(currentVersion.getWorkflowConfigId());
        
        // 3. 调用 worker 服务部署流程
        DeployVO deployVO = workflowClient.deployWorkflow(
            appId,
            workflowConfig.getId(),
            workflowConfig.getBpmn()
        );
        
        // 4. 保存流程定义信息到 bpm_proc_def
        BpmProcDefEntity procDef = new BpmProcDefEntity();
        procDef.setProcDefId(deployVO.getProcessDefinitionId());
        procDef.setModelCode(workflowConfig.getDefineId().split(":")[0]);
        procDef.setVersion(Integer.parseInt(workflowConfig.getDefineId().split(":")[1]));
        bpmProcDefService.save(procDef);
        
        // 5. 更新应用状态
        agentAppBaseEntity.setStatus("1");
        agentAppBaseEntity.setLatestVersion(currentVersion.getConfigVersion());
    }
}
```

#### **步骤 3：Worker 服务部署流程**

```java
// WorkflowServiceImpl.deployWorkflow()
public DeployVO deployWorkflow(WorkFlowDeployRequest deployRequest) {
    String file = bpmnPatcherService.normalizeMultiInstanceElementVariableRefs(
        deployRequest.getFile()
    );
    
    // 校验流程完整性
    checkWorkflowConfig(deployRequest.getWorkflowConfigId());
    checkIfNodeBranch(deployRequest.getWorkflowConfigId());
    checkQuestionNodeBranch(deployRequest.getWorkflowConfigId());
    checkEmptyVariable(file);
    
    // 部署到 Camunda
    DeployVO deployVO = logicProcessService.deploy(
        "NLP_" + deployRequest.getAppId(),
        file
    );
    
    return deployVO;
}
```

#### **步骤 4：Camunda 引擎部署**

```java
// LogicProcessServiceImpl.deploy()
public DeployVO deploy(String deploymentName, String bpmnXml) {
    // 创建部署
    Deployment deployment = repositoryService.createDeployment()
        .addStringInputStream(deploymentName + ".bpmn", 
            new ByteArrayInputStream(bpmnXml.getBytes()))
        .name(deploymentName)
        .deploy();
    
    // 查询部署的流程定义
    ProcessDefinition processDefinition = repositoryService
        .createProcessDefinitionQuery()
        .deploymentId(deployment.getId())
        .singleResult();
    
    // 返回部署信息
    DeployVO deployVO = new DeployVO();
    deployVO.setDeploymentId(deployment.getId());
    deployVO.setProcessDefinitionId(processDefinition.getId());
    deployVO.setProcessDefinitionKey(processDefinition.getKey());
    
    return deployVO;
}
```

#### **步骤 5：数据表变化**

**发布成功后，各表的变化**：

1. **ACT_RE_DEPLOYMENT** +1 条记录
   ```
   ID_: 805762665422929285
   NAME_: NLP_805760277769239685
   DEPLOY_TIME_: 2026-03-23 13:53:11.783
   ```

2. **ACT_RE_PROCDEF** +1 条记录
   ```
   ID_: process_804380352604671621:17:805762665620061573
   KEY_: process_804380352604671621
   VERSION_: 17
   DEPLOYMENT_ID_: 805762665422929285
   SUSPENSION_STATE_: 1 (活动)
   ```

3. **bpm_proc_def** +1 条记录
   ```
   proc_def_id: process_804380352604671621:17:805762665620061573
   model_code: process_804380352604671621
   version: 17
   ```

4. **agent_workflow_config** 更新 define_id
   ```
   define_id: process_804380352604671621:17:805762665620061573
   ```

5. **agent_app_base** 更新状态
   ```
   status: 1 (已发布)
   latest_version: config_version
   ```

---

### 3.2 应用取消发布流程

#### **步骤 1：用户点击"取消发布"**

```
前端请求 → AgentAppBaseController.publish(appId, "0")
```

#### **步骤 2：构建服务处理取消发布**

```java
// AgentAppBaseServiceImpl.publish()
public void publish(String appId, String status) {
    if ("0".equals(status)) {
        // 取消发布
        // 1. 查询当前应用版本
        AgentAppVersionEntity currentVersion = agentAppVersionService
            .getCurrentVersion(appId);
        
        // 2. 获取工作流配置
        if (StringUtils.hasText(currentVersion.getWorkflowConfigId())) {
            AgentWorkflowConfigEntity workflowConfig = agentWorkflowConfigService
                .getById(currentVersion.getWorkflowConfigId());
            
            // 3. 调用 worker 服务关闭定时任务
            if (StringUtils.hasText(workflowConfig.getDefineId())) {
                workflowClient.suspendTimerTask(workflowConfig.getDefineId());
            }
        }
        
        // 4. 更新应用状态
        agentAppBaseEntity.setStatus("0");
        agentAppBaseEntity.setLatestVersion(null);
    }
}
```

#### **步骤 3：Worker 服务关闭定时任务**

```java
// WorkflowServiceImpl.suspendTimerTaskByProcDefId()
public void suspendTimerTaskByProcDefId(String procDefId) {
    log.info("开始关闭定时任务，流程定义 ID: {}", procDefId);
    
    // 1. 查询该流程定义下是否有定时任务
    List<Job> jobs = managementService.createJobQuery()
        .processDefinitionKey(procDefId)
        .list();
    
    if (jobs == null || jobs.isEmpty()) {
        log.info("流程定义 {} 下没有找到定时任务，可能该流程不包含 Timer Event", procDefId);
    } else {
        log.info("流程定义 {} 下找到 {} 个定时任务，开始暂停...", procDefId, jobs.size());
        
        // 2. 暂停所有定时任务
        managementService.suspendJobByProcessDefinitionKey(procDefId);
        log.info("成功暂停 {} 个定时任务", jobs.size());
    }
    
    // 3. 暂停流程定义
    managementService.suspendJobDefinitionByProcessDefinitionKey(procDefId, true, null);
    log.info("定时任务关闭成功，流程定义 ID: {}", procDefId);
}
```

#### **步骤 4：数据表变化**

**取消发布成功后，各表的变化**：

1. **ACT_RE_PROCDEF** 更新状态
   ```
   SUSPENSION_STATE_: 2 (已暂停)
   ```

2. **ACT_RU_JOB** 清空相关作业
   ```
   SUSPENSION_STATE_: true (已暂停)
   ```

3. **agent_app_base** 更新状态
   ```
   status: 0 (未发布)
   latest_version: null
   ```

**注意**：
- 如果流程中没有 Timer Event，`ACT_RU_JOB` 表中不会有记录
- 暂停流程定义只是标记为不可执行，不会删除流程定义

---

### 3.3 流程实例启动流程

#### **步骤 1：用户触发流程**

```
前端请求 → WorkflowController.startChatflow(startRequest)
```

#### **步骤 2：Worker 服务启动流程实例**

```java
// WorkflowServiceImpl.startChatflow()
public SseEmitter startChatflow(WorkFlowStartRequest startRequest) {
    String appId = startRequest.getAppId();
    String businessKey = messageEntity.getId();
    
    // 1. 查询流程定义
    ProcessDefinition processDefinition = repositoryService
        .createProcessDefinitionQuery()
        .processDefinitionKey("process_" + appId)
        .latestVersion()
        .singleResult();
    
    // 2. 启动流程实例
    ProcessInstance processInstance = runtimeService
        .createProcessInstanceById(processDefinition.getId())
        .businessKey(businessKey)
        .setVariables(startRequest.getVariables())
        .start();
    
    // 3. 返回 SSE 流
    SseEmitter emitter = new SseEmitter(0L);
    // ... 监听流程执行事件，推送 SSE 消息
    
    return emitter;
}
```

#### **步骤 4：数据表变化**

**流程实例启动后，各表的变化**：

1. **ACT_RU_EXECUTION** +1 条记录
   ```
   ID_: execution_123
   PROCESS_DEF_ID_: process_804380352604671621:17:805762665620061573
   BUSINESS_KEY_: message_456
   ```

2. **ACT_RU_VARIABLE** +N 条记录（流程变量）
   ```
   ID_: var_1
   EXECUTION_ID_: execution_123
   NAME_: userInput
   VALUE_: "用户输入的内容"
   ```

3. **ACT_HI_PROCINST** +1 条记录
   ```
   ID_: process_instance_123
   PROCESS_DEF_ID_: process_804380352604671621:17:805762665620061573
   BUSINESS_KEY_: message_456
   START_TIME_: 2026-03-23 14:00:00
   ```

---

## 四、定时任务机制详解

### 4.1 Timer Event 类型

#### **4.1.1 Timer Start Event（定时启动事件）**

**作用**：定时自动启动流程实例

**BPMN 示例**：
```xml
<startEvent id="timerStart">
  <timerEventDefinition>
    <timeCycle>R/PT1H</timeCycle>  <!-- 每小时执行一次 -->
  </timerEventDefinition>
</startEvent>
```

**执行流程**：
1. Camunda 解析 BPMN，创建定时器
2. 在 `ACT_RU_TIMER` 表中插入记录
3. 定时器到期时，自动启动流程实例
4. 在 `ACT_RU_JOB` 表中创建作业

**数据表变化**：
```sql
-- ACT_RU_TIMER
ID_: timer_123
TYPE_: CYCLE
PROCESS_DEF_ID_: process_804380352604671621:17:805762665620061573
DUEDATE_: 2026-03-23 15:00:00

-- ACT_RU_JOB
ID_: job_123
TYPE_: timer
PROCESS_DEF_ID_: process_804380352604671621:17:805762665620061573
DUEDATE_: 2026-03-23 15:00:00
```

---

#### **4.1.2 Timer Boundary Event（定时边界事件）**

**作用**：为活动添加超时处理

**BPMN 示例**：
```xml
<serviceTask id="task1" name="调用 API">
  <bpmn:extensionElements>
    <camunda:inputOutput>
      <camunda:inputParameter name="url">http://api.example.com</camunda:inputParameter>
    </camunda:inputOutput>
  </bpmn:extensionElements>
</serviceTask>

<boundaryEvent id="timerBoundary" attachedToRef="task1">
  <timerEventDefinition>
    <timeDuration>PT5M</timeDuration>  <!-- 超时时间 5 分钟 -->
  </timerEventDefinition>
</boundaryEvent>
```

**执行流程**：
1. 流程执行到 `task1` 时，创建定时器
2. 如果 `task1` 在 5 分钟内完成，定时器取消
3. 如果 `task1` 超过 5 分钟未完成，触发边界事件
4. 执行边界事件后的分支（如发送告警）

---

#### **4.1.3 Timer Intermediate Event（定时中间事件）**

**作用**：在流程中插入延迟等待

**BPMN 示例**：
```xml
<intermediateCatchEvent id="timerWait">
  <timerEventDefinition>
    <timeDate>2026-03-24T09:00:00</timeDate>  <!-- 等待到指定时间 -->
  </timerEventDefinition>
</intermediateCatchEvent>
```

---

### 4.2 定时任务的生命周期

#### **阶段 1：创建**

```java
// Camunda 内部逻辑
TimerJobHandler.handleTimer(timerEventDefinition);

// 插入 ACT_RU_TIMER 表
timerJobEntity.setDuedate(calculateDueDate(timeCycle));
timerJobEntity.setProcessDefinitionId(processDefinitionId);
timerJobEntity.setRetries(3);
```

#### **阶段 2：等待**

- 定时器在 `ACT_RU_TIMER` 表中等待到期
- Camunda 的 Job Executor 定期扫描到期时间
- 默认扫描间隔：100ms（可配置）

#### **阶段 3：触发**

```java
// Job Executor 扫描到期的定时器
List<JobEntity> jobs = jobExecutor.scanForDueJobs();

// 将定时器转换为作业
timerJobEntity.setType("timer");
timerJobEntity.setDuedate(null);

// 插入 ACT_RU_JOB 表
jobExecutor.executeJob(timerJobEntity);
```

#### **阶段 4：执行**

```java
// 执行作业
try {
    jobEntity.execute();
    // 执行成功，删除作业
    jobEntity.delete();
} catch (Exception e) {
    // 执行失败，减少重试次数
    jobEntity.setRetries(jobEntity.getRetries() - 1);
    if (jobEntity.getRetries() == 0) {
        // 重试次数用尽，标记为失败
        jobEntity.setException(e.getMessage());
    }
}
```

#### **阶段 5：记录历史**

```java
// 插入历史日志
HistoricJobLogEntity logEntity = new HistoricJobLogEntity();
logEntity.setJobId(jobEntity.getId());
logEntity.setJobState("SUCCESS");
logEntity.setProcessDefinitionId(processDefinitionId);
logEntity.setRemovalTime(calculateRemovalTime());

historyService.save(logEntity);
```

---

### 4.3 定时任务暂停机制

#### **方法 1：暂停单个作业**

```java
managementService.suspendJobById(jobId);
```

**效果**：
- `ACT_RU_JOB.SUSPENSION_STATE_` = true
- 作业不会被执行
- 定时器不会倒计时

#### **方法 2：暂停流程定义下的所有作业**

```java
managementService.suspendJobByProcessDefinitionKey(procDefKey);
```

**效果**：
- 所有 `PROCESS_DEF_ID_` = procDefKey 的作业都被暂停
- `ACT_RU_JOB.SUSPENSION_STATE_` = true

#### **方法 3：暂停流程定义**

```java
managementService.suspendJobDefinitionByProcessDefinitionKey(
    procDefKey, 
    true,           // 是否级联暂停作业
    null            // 移除时间（null=立即）
);
```

**效果**：
1. `ACT_RE_PROCDEF.SUSPENSION_STATE_` = 2（已暂停）
2. 如果级联暂停，所有作业也暂停
3. 不能启动该流程定义的新实例

---

## 五、版本号管理规则

### 5.1 流程定义版本号规则

**Camunda 原生规则**：
1. 每次部署相同的 `KEY_`，版本号 +1
2. 版本号从 1 开始
3. `KEY_ + VERSION_` 唯一

**示例**：
```
第一次部署：
KEY_: process_804380352604671621
VERSION_: 1
ID_: process_804380352604671621:1:uuid1

第二次部署（相同 KEY）：
KEY_: process_804380352604671621
VERSION_: 2
ID_: process_804380352604671621:2:uuid2

第三次部署（相同 KEY）：
KEY_: process_804380352604671621
VERSION_: 3
ID_: process_804380352604671621:3:uuid3
```

### 5.2 业务表版本号规则

**bpm_proc_def 表**：
```sql
version: 17  -- 与 Camunda 版本号一致
```

**agent_app_version 表**：
```sql
config_version: v1.2.0  -- 应用版本号
is_current: 1           -- 是否当前版本
```

### 5.3 版本不匹配问题

**问题场景**：
1. 应用发布时，部署了版本 17 的流程定义
2. 取消发布时，传入的是版本 16 的流程定义 ID
3. Camunda 中找不到版本 16 的流程定义（已被覆盖）

**解决方案**：
```java
// 取消发布时，应该使用最新的流程定义 ID
AgentWorkflowConfigEntity workflowConfig = agentWorkflowConfigService
    .getById(currentVersion.getWorkflowConfigId());

// 从 bpm_proc_def 查询最新的流程定义 ID
BpmProcDefEntity latestProcDef = bpmProcDefService
    .getLatestByModelCode(workflowConfig.getDefineId().split(":")[0]);

// 使用最新的流程定义 ID
String actualProcDefId = latestProcDef.getProcDefId();
workflowClient.suspendTimerTask(actualProcDefId);
```

---

## 六、常见问题与排查

### 6.1 问题 1：定时任务没有执行

**现象**：
- `ACT_RU_JOB` 表中有记录
- 但定时任务没有触发

**可能原因**：
1. **作业被暂停**：`SUSPENSION_STATE_` = true
2. **重试次数用尽**：`RETRIES_` = 0
3. **Job Executor 未启动**：Camunda 配置问题
4. **数据库连接问题**：无法扫描到期作业

**排查步骤**：
```sql
-- 1. 检查作业状态
SELECT * FROM ACT_RU_JOB 
WHERE SUSPENSION_STATE_ = true;

-- 2. 检查重试次数
SELECT * FROM ACT_RU_JOB 
WHERE RETRIES_ = 0;

-- 3. 检查到期时间
SELECT * FROM ACT_RU_JOB 
WHERE DUEDATE_ < NOW();  -- 已到期的作业
```

---

### 6.2 问题 2：流程定义找不到

**现象**：
- 调用 `suspendJobByProcessDefinitionKey(procDefId)` 报错
- 提示找不到流程定义

**可能原因**：
1. **版本号不匹配**：传入的是旧版本的 ID
2. **部署被删除**：`ACT_RE_DEPLOYMENT` 记录被删除
3. **KEY 不一致**：传入的 KEY 与实际部署的 KEY 不同

**排查步骤**：
```sql
-- 1. 查询 Camunda 中的流程定义
SELECT * FROM ACT_RE_PROCDEF 
WHERE KEY_ = 'process_804380352604671621';

-- 2. 查询业务表中的流程定义
SELECT * FROM bpm_proc_def 
WHERE model_code = 'process_804380352604671621';

-- 3. 查询工作流配置
SELECT define_id FROM agent_workflow_config 
WHERE app_id = '应用 ID';
```

---

### 6.3 问题 3：历史作业日志为空

**现象**：
- `ACT_HI_JOB_LOG` 表中没有记录

**可能原因**：
1. **从来没有定时任务执行过**：流程中没有 Timer Event
2. **历史清理策略**：Camunda 自动清理旧日志
3. **History Level 配置**：配置为 NONE 或 ACTIVITY

**排查步骤**：
```sql
-- 1. 检查流程配置中是否有 Timer Event
SELECT bpmn FROM agent_workflow_config 
WHERE app_id = '应用 ID';

-- 2. 检查 Camunda 配置
SELECT * FROM ACT_GE_PROPERTY 
WHERE NAME_ = 'historyLevel';

-- 3. 检查清理策略
SELECT * FROM ACT_GE_PROPERTY 
WHERE NAME_ LIKE '%cleanup%';
```

---

## 七、最佳实践建议

### 7.1 定时任务使用建议

1. **明确是否需要定时任务**
   - 普通工作流（用户触发）：不需要 Timer Event
   - 定时报表：使用 Timer Start Event
   - 超时处理：使用 Timer Boundary Event

2. **合理设置 Cron 表达式**
   ```xml
   <!-- 每天凌晨 2 点执行 -->
   <timeCycle>0 0 2 * * ?</timeCycle>
   
   <!-- 每小时执行一次 -->
   <timeCycle>R/PT1H</timeCycle>
   
   <!-- 每 5 分钟执行一次 -->
   <timeCycle>R/PT5M</timeCycle>
   ```

3. **错峰执行**
   - 避免多个定时任务同时执行
   - 建议设置不同的执行时间

---

### 7.2 版本管理建议

1. **使用最新的流程定义 ID**
   ```java
   // 查询最新版本
   BpmProcDefEntity latest = bpmProcDefService
       .getLatestByModelCode(modelCode);
   ```

2. **保留历史版本**
   - 不要立即删除旧版本
   - 等待所有进行中的流程实例完成

3. **版本号命名规范**
   ```
   业务版本号：v1.0.0, v1.1.0, v2.0.0
   Camunda 版本号：1, 2, 3
   ```

---

### 7.3 监控与日志

1. **添加详细的日志**
   ```java
   log.info("开始关闭定时任务，流程定义 ID: {}", procDefId);
   log.info("找到 {} 个定时任务", jobs.size());
   log.info("成功暂停 {} 个定时任务", jobs.size());
   ```

2. **监控定时任务状态**
   ```java
   @Scheduled(cron = "0 */5 * * * ?")  // 每 5 分钟检查一次
   public void monitorTimerJobs() {
       List<Job> jobs = managementService.createJobQuery()
           .suspended()
           .list();
       
       if (!jobs.isEmpty()) {
           log.warn("发现 {} 个已暂停的定时任务", jobs.size());
       }
   }
   ```

3. **异常告警**
   ```java
   if (jobEntity.getException() != null) {
       log.error("定时任务执行失败：{}", jobEntity.getException());
       // 发送告警通知
   }
   ```

---

## 八、核心代码位置

### 8.1 发布相关

```
AgentAppBaseServiceImpl.publish()           // 发布入口
WorkflowClient.deployWorkflow()             // Feign 客户端
WorkflowController.deploy()                 // Worker Controller
WorkflowServiceImpl.deployWorkflow()        // Worker Service
LogicProcessServiceImpl.deploy()            // Camunda 部署
```

### 8.2 取消发布相关

```
AgentAppBaseServiceImpl.publish()           // 取消发布入口
WorkflowClient.suspendTimerTask()           // Feign 客户端
WorkflowController.suspendTimerTask()       // Worker Controller
WorkflowServiceImpl.suspendTimerTaskByProcDefId()  // Worker Service
```

### 8.3 流程启动相关

```
WorkflowController.startChatflow()          // 启动入口
WorkflowServiceImpl.startChatflow()         // Worker Service
LogicProcessServiceImpl.startProcess()      // Camunda 启动
```

---

## 九、关键数据关系图

```
┌─────────────────────────────────────────────────────────────┐
│                     应用发布流程数据流                        │
└─────────────────────────────────────────────────────────────┘

应用发布请求
    ↓
AgentAppBaseServiceImpl.publish(appId)
    ↓
查询 agent_app_version (当前版本)
    ↓ workflow_config_id
查询 agent_workflow_config (工作流配置)
    ↓ define_id, bpmn
调用 WorkflowClient.deployWorkflow()
    ↓
Worker 服务接收请求
    ↓
WorkflowServiceImpl.deployWorkflow()
    ↓
LogicProcessServiceImpl.deploy()
    ↓
Camunda RepositoryService.createDeployment()
    ↓
写入 ACT_RE_DEPLOYMENT (部署记录)
    ↓
写入 ACT_RE_PROCDEF (流程定义)
    ↓
写入 bpm_proc_def (业务扩展)
    ↓
更新 agent_workflow_config.define_id
    ↓
更新 agent_app_base.status = 1
    ↓
发布完成！

┌─────────────────────────────────────────────────────────────┐
│                   定时任务生命周期数据流                      │
└─────────────────────────────────────────────────────────────┘

BPMN 中包含 Timer Event
    ↓
Camunda 解析 BPMN
    ↓
创建 ACT_RU_TIMER 记录
    ↓
等待到期时间
    ↓
Job Executor 扫描到期
    ↓
转换为 ACT_RU_JOB 记录
    ↓
执行作业
    ↓
成功 → 删除 ACT_RU_JOB → 写入 ACT_HI_JOB_LOG
失败 → 减少 RETRIES_ → 重试或标记失败
```

---

## 十、总结

### 10.1 核心要点

1. **Camunda 数据表分为 4 类**：RE（定义）、RU（运行时）、HI（历史）、GE（通用）
2. **流程定义 KEY + VERSION 唯一**：相同 KEY 的版本号递增
3. **定时任务需要 Timer Event**：没有 Timer Event 就不会有作业记录
4. **暂停机制**：可以暂停单个作业、流程定义下的所有作业、或整个流程定义
5. **版本管理**：业务表和 Camunda 表的版本号要对应

### 10.2 您的应用情况

根据查询结果分析：

1. **您的应用没有定时任务**
   - `ACT_RU_JOB` 最新数据是 2025 年 6 月的
   - `ACT_HI_JOB_LOG` 没有任何记录
   - BPMN 配置中可能没有 Timer Event

2. **取消发布功能已正确实现**
   - 代码逻辑正确
   - 接口调用成功
   - 只是没有定时任务可关

3. **版本不匹配问题**
   - 取消发布时传入的是版本 16 的 ID
   - 数据库中是版本 17
   - 建议查询最新版本号

### 10.3 后续建议

1. **明确应用类型**
   - 如果是普通工作流（用户触发），不需要定时任务
   - 如果需要定时执行，在 BPMN 中添加 Timer Start Event

2. **优化版本管理**
   - 取消发布时使用最新的流程定义 ID
   - 从 `bpm_proc_def` 表查询最新版本

3. **增强监控**
   - 添加定时任务监控日志
   - 异常时发送告警通知

---

**文档版本**：v1.0  
**更新时间**：2026-03-23  
**作者**：基于实际项目数据整理
