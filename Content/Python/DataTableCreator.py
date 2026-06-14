import unreal


def to_unreal_asset_path(path: str) -> str:
    asset_path = path.replace("\\", "/").rstrip("/")
    if "/Content/" in asset_path:
        asset_path = asset_path.split("/Content/", 1)[1]
    if asset_path.startswith("/Content/"):
        asset_path = asset_path[len("/Content/"):]
    if "/Game/" in asset_path:
        asset_path = asset_path.split("/Game/", 1)[1]
    asset_path = asset_path.lstrip("/")
    return "/Game/" + asset_path


def create_datatable_from_template(new_datatable_name="DT_GameDataTable",
                                   template_datatable_path="BoxPushingGame/Content/BluePrint/Structure/DT_GameDataTable1",
                                   target_directory="BoxPushingGame/Content/BluePrint/Structure",
                                   open_after_create=False):
    """基于模板 DataTable 复制生成新的资产。参数可传磁盘路径或 Content 目录路径。"""

    template_asset_path = to_unreal_asset_path(template_datatable_path)
    target_asset_dir = to_unreal_asset_path(target_directory)
    full_new_path = f"{target_asset_dir}/{new_datatable_name}"

    # 目标已存在
    if unreal.EditorAssetLibrary.does_asset_exist(full_new_path):
        unreal.EditorDialog.show_message(
            "创建失败",
            f"资产 {full_new_path} 已存在，请使用其他名称。",
            unreal.AppMsgType.OK
        )
        return False

    # 模板存在性与加载
    if not unreal.EditorAssetLibrary.does_asset_exist(template_asset_path):
        unreal.EditorDialog.show_message(
            "失败",
            f"模板资产不存在: {template_asset_path}。请检查路径是否指向内容浏览器中的资产。",
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

    # 类型检查
    try:
        asset_class_name = template_asset.get_class().get_name()
    except Exception:
        asset_class_name = str(type(template_asset))

    unreal.log(f"模板资产类型: {asset_class_name}")
    if asset_class_name != "DataTable":
        unreal.EditorDialog.show_message(
            "失败",
            f"模板资产不是 DataTable，而是 {asset_class_name}。请使用 DataTable 资产作为模板。",
            unreal.AppMsgType.OK
        )
        return False

    # 确保目标目录存在
    if not unreal.EditorAssetLibrary.does_directory_exist(target_asset_dir):
        unreal.EditorAssetLibrary.make_directory(target_asset_dir)

    duplicated = unreal.EditorAssetLibrary.duplicate_asset(source_asset_path=template_asset_path,
                                                          destination_asset_path=full_new_path)

    if duplicated:
        try:
            unreal.EditorAssetLibrary.save_asset(full_new_path)
        except Exception:
            unreal.log_warning(f"无法保存资产 {full_new_path}（API 不可用或出错）")

        unreal.EditorDialog.show_message("成功", f"DataTable {new_datatable_name} 已基于模板创建。", unreal.AppMsgType.OK)

        if open_after_create:
            try:
                unreal.EditorAssetLibrary.open_editor_for_asset(unreal.load_asset(full_new_path))
            except Exception as e:
                unreal.log_error(f"打开 DataTable 时出错: {e}")

        return True
    else:
        unreal.EditorDialog.show_message(
            "失败",
            f"无法创建 DataTable {new_datatable_name}，请检查模板路径是否正确。",
            unreal.AppMsgType.OK
        )
        return False


if __name__ == "__main__":
    create_datatable_from_template()