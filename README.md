# BoxPushingGame

BoxPushingGame 是一个基于 Unreal Engine 5 的简易推箱子（箱子推动）示例项目，包含第三人称角色、若干示例关卡、UI 和用于内容生成的 Python 编辑器脚本。

**引擎与依赖**
- **Engine:** Unreal Engine 5.5（见 `BoxPushingGame.uproject` 中的 `EngineAssociation`）
- **代码模块依赖:** `EnhancedInput`（详见 `Source/BoxPushingGame/BoxPushingGame.Build.cs`）

**项目概览**
- 游戏类型：第三人称视角的推箱子样例（基于第三人称模板改造）
- 包含内容：多个关卡地图（Level0..Level3、L_UI 等）、Blueprint、材质、UI 资源、以及编辑器用的 Python 脚本

**主要目录（简要）**
- `Source/`：C++ 源码，包含 `BoxPushingGame` 模块和角色、GameMode 实现。
- `Content/Level/`、`Content/Fab/Level/`：示例关卡与地图文件（.umap / .uasset，二进制资源由编辑器管理）。
- `Content/BluePrint/`：Blueprint 与数据表模板（主要）。
- `Content/Python/`：编辑器辅助脚本（`level_creator.py`、`DataTableCreator.py`），用于基于模板批量创建关卡与 DataTable。

**快速开始（在 Windows 上）**
1. 安装并启动 Unreal Engine 5.5。
2. 双击 `BoxPushingGame.uproject` 打开项目，或在 Epic Games Launcher 中选择关联的 Engine 版本打开。
3. 若首次打开需要生成/更新 Visual Studio 项目：打开项目目录，右键选择 "Generate Visual Studio project files" 或使用 Unreal 的菜单来生成解决方案，然后用 Visual Studio 打开 `BoxPushingGame.sln` 并编译。

**运行与调试**
- 在 Unreal Editor 中：点击 "Play" 在编辑器内运行。可以切换不同地图进行测试（`Content/Level/` 下的关卡）。
- 在 Visual Studio 中：选择 `UnrealEditor` 或相应目标进行调试（按需参考 Unreal 官方文档）。

**控制（默认）**
- 移动：W/A/S/D
- 视角：鼠标移动
- 跳跃：空格键
- 推箱子：靠近可推动的箱子并移动（游戏使用物理/碰撞检测实现箱子推动效果）

**编辑器脚本说明**
- `Content/Python/level_creator.py`：基于模板关卡复制并创建新关卡的示例脚本，适合在编辑器的 Execute Python Script 节点或直接在编辑器 Python 控制台中运行。
- `Content/Python/DataTableCreator.py`：基于模板 DataTable 复制生成新的 DataTable 资产的脚本。

**已知问题**
- 在部分机器上，Epic Launcher/编辑器启动时可能卡在 "初始化 Python"；如果遇到该问题，可尝试使用任务管理器结束与 UE5 相关的 Python 进程（或全部 Python），然后重新启动编辑器。

**贡献与扩展建议**
- 可扩展的方向：添加关卡目标（如箱子推到指定位置判定胜利）、计时/计步评分系统、AI 干扰、关卡编辑器工具、关卡/数据的自动化生成脚本。
- 若要贡献代码：在创建分支后修改 `Source/` 中的 C++ 源文件并提交 Pull Request；对 Blueprint/资源改动请一并包含必要的说明和测试步骤。

**参考**
- 项目文件：`BoxPushingGame.uproject`（项目配置）
- 编辑器脚本：`Content/Python/`（查看 `level_creator.py`、`DataTableCreator.py`）

