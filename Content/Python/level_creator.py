import unreal


def create_level_from_template(new_level_name="Leve3", template_level_path="BoxPushingGame/Content/Level/Level1", target_directory="BoxPushingGame/Content/Level", open_after_create=False):
    # 获取当前编辑器的工具控件实例（假设脚本运行在 EUW 的 Execute Python Script 节点中）
    # 通过 unreal.EditorUtilityLibrary 获取当前选中的控件（或直接传入参数）
    # 这里简化：从控件属性读取用户输入（需要在 EUW 中将文本框绑定到 Python 可访问的属性）
    # 实际使用中，建议在 EUW 中将文本框的 Text 作为字符串参数传递给 Execute Python Script 节点
    # 以下示例展示如果通过字符串参数传递关卡名称的方式

    def to_unreal_asset_path(path: str) -> str:
        asset_path = path.replace("\\", "/").rstrip("/")
        if "/Content/" in asset_path:
            asset_path = asset_path.split("/Content/", 1)[1]
        if asset_path.startswith("/Content/"):
            asset_path = asset_path[len("/Content/"):]
        asset_path = asset_path.lstrip("/")
        return "/Game/" + asset_path

    template_asset_path = to_unreal_asset_path(template_level_path)
    target_asset_dir = to_unreal_asset_path(target_directory)
    full_new_path = f"{target_asset_dir}/{new_level_name}"

    # 验证模板资产存在且类型合适，尽早返回明确错误以便排查
    if not unreal.EditorAssetLibrary.does_asset_exist(template_asset_path):
        unreal.EditorDialog.show_message(
            "失败",
            f"模板资产不存在: {template_asset_path}。请检查路径是否指向内容浏览器中的资产（例如 /Game/...）。",
            unreal.AppMsgType.OK
        )
        return False

    template_asset = unreal.load_asset(template_asset_path)
    if template_asset is None:
        unreal.EditorDialog.show_message(
            "失败",
            f"无法加载模板资产: {template_asset_path}。可能路径错误或资源损坏。",
            unreal.AppMsgType.OK
        )
        return False

    # 常见的关卡/地图资产类型名为 'World'，如果不是则提示并返回
    try:
        asset_class_name = template_asset.get_class().get_name()
    except Exception:
        asset_class_name = str(type(template_asset))

    unreal.log(f"模板资产类型: {asset_class_name}")
    if asset_class_name != "World":
        unreal.EditorDialog.show_message(
            "失败",
            f"模板资产不是关卡 (World)，而是 {asset_class_name}。请使用关卡/地图作为模板。",
            unreal.AppMsgType.OK
        )
        return False

    # 检查是否存在同名资产
    if unreal.EditorAssetLibrary.does_asset_exist(full_new_path):
        unreal.EditorDialog.show_message(
            "创建失败",
            f"资产 {full_new_path} 已存在，请使用其他名称。",
            unreal.AppMsgType.OK
        )
        return False

    # 确保目标目录存在（如果不存在则创建）
    if not unreal.EditorAssetLibrary.does_directory_exist(target_asset_dir):
        unreal.EditorAssetLibrary.make_directory(target_asset_dir)

    # 复制模板关卡（只创建资产文件，默认不自动打开以避免编辑器世界泄露）
    duplicated = unreal.EditorAssetLibrary.duplicate_asset(source_asset_path=template_asset_path, destination_asset_path=full_new_path)

    if duplicated:
        # 尝试保存新资产，确保磁盘上存在对应文件
        try:
            unreal.EditorAssetLibrary.save_asset(full_new_path)
        except Exception:
            # 若 API 不可用则忽略保存错误，但继续返回成功状态
            unreal.log_warning(f"无法保存资产 {full_new_path}（API 不可用或出错）")

        unreal.EditorDialog.show_message("成功", f"关卡 {new_level_name} 已基于模板创建。", unreal.AppMsgType.OK)

        # 根据调用者意图决定是否打开新关卡；默认不打开以避免在 EUW 中反复创建/切换世界导致内存泄露
        if open_after_create:
            try:
                unreal.EditorLevelLibrary.load_level(full_new_path)
            except Exception as e:
                unreal.log_error(f"打开关卡时出错: {e}")

        # 尝试触发垃圾回收，减少编辑器世界泄露风险（如果 Python API 提供）
        gc_func = getattr(unreal.SystemLibrary, 'collect_garbage', None)
        if callable(gc_func):
            try:
                gc_func()
            except Exception:
                pass

        return True
    else:
        unreal.EditorDialog.show_message(
            "失败",
            f"无法创建关卡 {new_level_name}，请检查模板路径是否正确。",
            unreal.AppMsgType.OK
        )
        return False

# 调用函数（如果作为独立脚本执行，则直接运行）
if __name__ == "__main__":
    create_level_from_template()