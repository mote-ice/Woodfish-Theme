const path = require('path')
const fs = require('fs')
const vscode = require('vscode')

/**
 * Woodfish Theme - 原创 VSCode 主题扩展
 * 作者：Woodfish
 * 许可证：MIT
 * 版本：3.0.0
 *
 * 更新内容：修复更新了彩色光标
 *
 * 特别感谢：
 * - 感谢 shaobeichen 为本项目提供灵感
 * - 感谢 Bearded Theme 提供开源主题代码
 */

// ==================== 配置常量 ====================

const EXTENSION_CONFIG = {
  name: 'woodfish-theme',
  displayName: 'Woodfish Theme',
  versionKey: 'woodfish-theme-vscode-version',
  configSection: 'woodfishTheme',
  themeFileName: 'woodfish-theme.css',
  customCssConfigKey: 'vscode_custom_css.imports'
}

// ==================== 全局变量 ====================

let extensionContext = null

// ==================== 工具函数 ====================



/**
 * 显示信息消息
 * @param {string} message 消息内容
 */
function showInfoMessage(message) {
  vscode.window.showInformationMessage(`[Woodfish Theme] ${message}`)
}

/**
 * 显示错误消息
 * @param {string} message 错误消息
 */
function showErrorMessage(message) {
  vscode.window.showErrorMessage(`[Woodfish Theme] ${message}`)
}

/**
 * 显示重启提示消息
 * @param {string} message 提示消息
 */
function showReloadPrompt(message) {
  const reloadAction = '重新加载窗口'
  const dismissAction = '稍后'

  vscode.window
    .showInformationMessage(`[Woodfish Theme] ${message}`, reloadAction, dismissAction)
    .then(selection => {
      if (selection === reloadAction) {
        vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    })
}

// ==================== 主题配置函数 ====================

/**
 * 配置主题CSS文件到Custom CSS扩展
 */
function configureThemeCSS() {
  try {
    console.log('开始配置主题CSS')

    // 检查是否安装了 Custom CSS and JS Loader 扩展或 Custom CSS Hot Reload 扩展
    const isCustomCssInstalled = isCustomCssExtensionInstalled()
    const isHotReloadInstalled = isCustomCssHotReloadExtensionInstalled()

    // 如果两个扩展都没有安装，则显示安装提示
    if (!isCustomCssInstalled && !isHotReloadInstalled) {
      console.log('没有检测到 Custom CSS 扩展，显示安装提示')
      showBothExtensionsInstallPrompt()
      return
    }

    console.log('检测到至少一个 Custom CSS 扩展已安装')

    // 根据安装的扩展类型决定使用哪个配置键
    let configKey
    let extensionName
    if (isCustomCssInstalled) {
      configKey = 'vscode_custom_css.imports'
      extensionName = 'Custom CSS and JS Loader'
    } else {
      configKey = 'custom_css_hot_reload.imports'
      extensionName = 'Custom CSS Hot Reload'
    }

    // 获取当前配置
    const config = vscode.workspace.getConfiguration()
    const customCssImports = config.get(configKey, [])

    // 构建主题CSS文件路径
    const themeStylePath = path.join(__dirname, 'themes', EXTENSION_CONFIG.themeFileName)
    const themeFileUri = `file:///${themeStylePath.replace(/\\/g, '/')}`

    console.log('目标主题配置路径:', themeFileUri)
    console.log('当前导入列表:', customCssImports)
    console.log('使用配置键:', configKey)

    // 更精确地检查是否已经配置了主题CSS
    const isThemeConfigured = customCssImports.some(importPath => {
      // 完全匹配文件URI
      if (importPath === themeFileUri) {
        console.log('找到完全匹配的主题配置:', importPath)
        return true
      }
      // 备用匹配：检查是否包含主题文件标识
      if (importPath.includes('woodfish-theme.css')) {
        console.log('找到包含主题文件标识的配置:', importPath)
        return true
      }
      return false
    })

    if (isThemeConfigured) {
      console.log('主题CSS已经配置')
      showCustomCssEnablePrompt(extensionName)
      return
    }

    // 检查文件是否存在
    if (!fs.existsSync(themeStylePath)) {
      console.error(`主题CSS文件不存在: ${themeStylePath}`)
      showErrorMessage('主题CSS文件不存在，请检查扩展安装是否完整')
      return
    }

    console.log(`添加主题配置: ${themeFileUri}`)

    // 自动添加主题CSS配置
    const newImports = [...customCssImports, themeFileUri]

    config.update(configKey, newImports, vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('主题CSS配置已添加')
        showCustomCssEnablePrompt(extensionName)
      })
      .catch(error => {
        console.error('配置主题CSS失败:', error)
        showErrorMessage(`配置主题CSS失败: ${error.message}`)
      })

  } catch (error) {
    console.error('配置主题CSS时出错:', error)
    showErrorMessage(`配置主题CSS失败: ${error.message}`)
  }
}

// ==================== 自定义 CSS 集成函数 ====================

/**
 * 检查是否安装了 Custom CSS and JS Loader 扩展
 * @returns {boolean} 是否已安装
 */
function isCustomCssExtensionInstalled() {
  try {
    const extension = vscode.extensions.getExtension('be5invis.vscode-custom-css')
    return Boolean(extension)
  } catch (error) {
    console.error('检查 Custom CSS 扩展时出错:', error)
    return false
  }
}

/**
 * 检查是否安装了 Custom CSS Hot Reload 扩展
 * @returns {boolean} 是否已安装
 */
function isCustomCssHotReloadExtensionInstalled() {
  try {
    const extension = vscode.extensions.getExtension('bartag.custom-css-hot-reload')
    return Boolean(extension)
  } catch (error) {
    console.error('检查 Custom CSS Hot Reload 扩展时出错:', error)
    return false
  }
}

/**
 * 自动配置彩色光标
 * 检查 Custom CSS and JS Loader 扩展或 Custom CSS Hot Reload 扩展，如果都没有安装则提示用户安装
 */
function autoConfigureRainbowCursor() {
  try {
    console.log('开始自动配置彩色光标')

    // 检查是否安装了 Custom CSS and JS Loader 扩展或 Custom CSS Hot Reload 扩展
    const isCustomCssInstalled = isCustomCssExtensionInstalled()
    const isHotReloadInstalled = isCustomCssHotReloadExtensionInstalled()

    // 如果两个扩展都没有安装，则显示安装提示
    if (!isCustomCssInstalled && !isHotReloadInstalled) {
      console.log('没有检测到 Custom CSS 扩展，显示安装提示')
      showBothExtensionsInstallPrompt()
      return
    }

    console.log('检测到至少一个 Custom CSS 扩展已安装')

    // 根据安装的扩展类型决定使用哪个配置键
    let configKey
    if (isCustomCssInstalled) {
      configKey = 'vscode_custom_css.imports'
    } else {
      configKey = 'custom_css_hot_reload.imports'
    }

    // 继续配置彩色光标
    configureRainbowCursor(configKey)

  } catch (error) {
    console.error('自动配置彩色光标时出错:', error)
    showErrorMessage(`配置彩色光标失败: ${error.message}`)
  }
}

/**
 * 配置彩色光标的 CSS 设置
 * @param {string} configKey - 配置键，可选，默认为 'vscode_custom_css.imports'
 */
function configureRainbowCursor(configKey = 'vscode_custom_css.imports') {
  try {
    console.log('开始配置彩色光标 CSS')

    // 检查是否已经配置了彩色光标
    const config = vscode.workspace.getConfiguration()
    const customCssImports = config.get(configKey, [])

    // 构建彩色光标 CSS 文件的路径
    const rainbowCursorPath = path.join(__dirname, 'custom-css', 'rainbow-cursor.css')
    const fileUri = `file:///${rainbowCursorPath.replace(/\\/g, '/')}`

    console.log('目标配置路径:', fileUri)
    console.log('当前导入列表:', customCssImports)
    console.log('使用配置键:', configKey)

    // 更精确地检查是否已经配置了彩色光标
    const isAlreadyConfigured = customCssImports.some(importPath => {
      // 完全匹配文件URI
      if (importPath === fileUri) {
        console.log('找到完全匹配的彩色光标配置:', importPath)
        return true
      }
      // 检查是否包含彩虹光标文件标识（备用匹配）
      if (importPath.includes('rainbow-cursor.css')) {
        console.log('找到包含彩虹光标标识的配置:', importPath)
        return true
      }
      return false
    })

    if (isAlreadyConfigured) {
      console.log('彩色光标已经配置，显示启用提示')
      showCustomCssEnablePrompt(configKey.includes('hot_reload') ? 'Custom CSS Hot Reload' : 'Custom CSS and JS Loader')
      return
    }

    // 检查文件是否存在
    if (!fs.existsSync(rainbowCursorPath)) {
      console.error(`彩色光标CSS文件不存在: ${rainbowCursorPath}`)
      showErrorMessage('彩色光标CSS文件不存在，请检查扩展安装是否完整')
      return
    }

    console.log(`添加彩色光标配置: ${fileUri}`)

    // 自动添加彩色光标配置
    const newImports = [...customCssImports, fileUri]

    config.update(configKey, newImports, vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('彩色光标配置已添加')
        showCustomCssEnablePrompt(configKey.includes('hot_reload') ? 'Custom CSS Hot Reload' : 'Custom CSS and JS Loader')
      })
      .catch(error => {
        console.error('配置彩色光标失败:', error)
        showErrorMessage(`配置彩色光标失败: ${error.message}`)
      })

  } catch (error) {
    console.error('配置彩色光标 CSS 时出错:', error)
    showErrorMessage(`配置彩色光标失败: ${error.message}`)
  }
}

/**
 * 显示两个 Custom CSS 扩展的安装提示，让用户选择安装其中一个
 */
function showBothExtensionsInstallPrompt() {
  const installCustomCssAction = '安装 Custom CSS and JS Loader'
  const installHotReloadAction = '安装 Custom CSS Hot Reload'
  const laterAction = '稍后'

  const message = '要启用 Woodfish 主题，需要安装 Custom CSS 扩展。请选择要安装的扩展：'

  vscode.window
    .showInformationMessage(
      `[Woodfish Theme] ${message}`,
      installCustomCssAction,
      installHotReloadAction,
      laterAction
    )
    .then(selection => {
      switch (selection) {
      case installCustomCssAction:
        installCustomCssExtension()
        break
      case installHotReloadAction:
        installCustomCssHotReloadExtension()
        break
      case laterAction:
      default:
        showInfoMessage('您可以稍后通过命令面板执行"开启 Woodfish 主题"来重新配置')
        break
      }
    })
}


/**
 * 安装 Custom CSS Hot Reload 扩展
 */
function installCustomCssHotReloadExtension() {
  try {
    // 确保使用正确的扩展ID
    const extensionId = 'bartag.custom-css-hot-reload'

    // 提示用户安装方式
    const installAction = '在扩展市场安装'
    const laterAction = '稍后'

    vscode.window.showInformationMessage(
      '[Woodfish Theme] 正在为您打开 Custom CSS Hot Reload 扩展安装页面...',
      installAction,
      laterAction
    ).then(selection => {
      if (selection === installAction) {
        // 使用VSCode命令打开插件市场页面
        const extensionUri = vscode.Uri.parse(`vscode:extension/${extensionId}`)

        vscode.commands.executeCommand('vscode.open', extensionUri)
          .then(() => {
            showInfoMessage(`已打开 ${extensionId} 扩展页面，请点击安装按钮完成安装`)
          })
          .catch(error => {
            console.error('打开扩展页面失败:', error)
            showErrorMessage(`无法打开扩展页面，请手动在扩展市场搜索"${extensionId}"安装`)
          })
      }
    })
  } catch (error) {
    console.error('安装 Custom CSS Hot Reload 扩展时出错:', error)
    showErrorMessage(`安装扩展失败: ${error.message}，请手动在扩展市场搜索"Custom CSS Hot Reload"安装`)
  }
}

/**
 * 安装 Custom CSS and JS Loader 扩展
 */
function installCustomCssExtension() {
  try {
    // 提示用户选择安装方式
    const scriptAction = '使用脚本安装 (推荐)'
    const manualAction = '手动安装'
    const cancelAction = '取消'

    vscode.window.showInformationMessage(
      '[Woodfish Theme] 要启用彩色光标，需要安装 Custom CSS and JS Loader 扩展。请选择安装方式：',
      scriptAction,
      manualAction,
      cancelAction
    ).then(selection => {
      if (selection === scriptAction) {
        // 使用脚本安装
        installUsingScript()
      } else if (selection === manualAction) {
        // 手动安装
        installManually()
      }
    })
  } catch (error) {
    console.error('安装 Custom CSS 扩展时出错:', error)
    showErrorMessage(`安装扩展失败: ${error.message}，请手动在扩展市场搜索"Custom CSS and JS Loader"安装`)
  }
}

/**
 * 使用脚本安装 Custom CSS and JS Loader 扩展
 */
function installUsingScript() {
  try {
    // 获取脚本路径
    const scriptPath = path.join(__dirname, 'scripts', 'install-custom-css.sh')

    // 确保脚本存在
    if (!fs.existsSync(scriptPath)) {
      showErrorMessage('安装脚本不存在，请使用手动安装方式')
      installManually()
      return
    }

    // 确保脚本可执行
    fs.chmodSync(scriptPath, '755')

    // 创建终端并执行脚本
    const terminal = vscode.window.createTerminal('Woodfish Theme - 安装 Custom CSS')

    // 根据操作系统执行不同的命令
    if (process.platform === 'win32') {
      // Windows
      terminal.sendText('powershell -ExecutionPolicy Bypass -Command "code --install-extension be5invis.vscode-custom-css"')
    } else {
      // macOS 或 Linux
      terminal.sendText(`bash "${scriptPath}"`)
    }

    terminal.show()

    // 提示用户安装完成后的操作
    setTimeout(() => {
      vscode.window.showInformationMessage(
        '[Woodfish Theme] 安装完成后，请重启 VSCode 并执行以下步骤：\n1. 按 Ctrl+Shift+P 打开命令面板\n2. 执行"Enable Custom CSS and JS"命令\n3. 重启 VSCode',
        '我已完成'
      ).then(selection => {
        if (selection === '我已完成') {
          configureRainbowCursor()
        }
      })
    }, 5000)

  } catch (error) {
    console.error('使用脚本安装时出错:', error)
    showErrorMessage(`脚本安装失败: ${error.message}，请尝试手动安装`)
    installManually()
  }
}

/**
 * 手动安装 Custom CSS and JS Loader 扩展
 */
function installManually() {
  try {
    const extensionId = 'be5invis.vscode-custom-css'

    // 打开扩展搜索
    vscode.commands.executeCommand('workbench.extensions.search', extensionId)
      .then(() => {
        showInfoMessage('已打开扩展搜索，请在扩展市场中找到并安装 Custom CSS and JS Loader')

        // 提示用户安装完成后的操作
        setTimeout(() => {
          vscode.window.showInformationMessage(
            '[Woodfish Theme] 安装完成后，请重启 VSCode 并执行以下步骤：\n1. 按 Ctrl+Shift+P 打开命令面板\n2. 执行"Enable Custom CSS and JS"命令\n3. 重启 VSCode',
            '我已完成'
          ).then(selection => {
            if (selection === '我已完成') {
              configureRainbowCursor()
            }
          })
        }, 3000)
      })
      .catch(error => {
        console.error('打开扩展搜索失败:', error)

        // 备用方案：打开扩展页面
        const extensionUri = vscode.Uri.parse(`vscode:extension/${extensionId}`)
        vscode.commands.executeCommand('vscode.open', extensionUri)
          .then(() => {
            showInfoMessage('已打开 Custom CSS and JS Loader 扩展页面，请点击安装按钮完成安装')
          })
          .catch(openError => {
            console.error('打开扩展页面失败:', openError)
            showErrorMessage('无法打开扩展页面，请手动在扩展市场搜索"Custom CSS and JS Loader"安装')
          })
      })
  } catch (error) {
    console.error('手动安装时出错:', error)
    showErrorMessage(`无法启动手动安装: ${error.message}，请在扩展市场中搜索"Custom CSS and JS Loader"安装`)
  }
}

/**
 * 显示 Custom CSS 启用提示
 * @param {string} extensionName - 扩展名称，可选
 */
function showCustomCssEnablePrompt(extensionName = 'Custom CSS and JS Loader') {
  const enableAction = '启用 Custom CSS'
  const laterAction = '稍后'
  const guideAction = '查看指南'

  let message
  if (extensionName.includes('Hot Reload')) {
    message = `主题配置已添加！现在需要启用 ${extensionName} 扩展才能看到效果。`
  } else {
    message = `主题配置已添加！现在需要启用 ${extensionName} 扩展才能看到效果。`
  }

  vscode.window
    .showInformationMessage(
      `[Woodfish Theme] ${message}`,
      enableAction,
      guideAction,
      laterAction
    )
    .then(selection => {
      switch (selection) {
      case enableAction:
        if (extensionName.includes('Hot Reload')) {
          // Custom CSS Hot Reload 扩展可能有不同的启用命令
          enableCustomCssHotReload()
        } else {
          enableCustomCss()
        }
        break
      case guideAction:
        showCustomCssSetupGuide()
        break
      case laterAction:
      default:
        showInfoMessage(`您可以稍后通过命令面板执行相应命令来启用 ${extensionName} 效果`)
        break
      }
    })
}



/**
 * 启用 Custom CSS Hot Reload
 */
function enableCustomCssHotReload() {
  try {
    // Custom CSS Hot Reload 扩展通常会自动应用CSS更改，不需要特定命令
    // 需要重新加载窗口以应用CSS
    showReloadPrompt('Custom CSS 配置已更新！VSCode 需要重新加载以应用主题效果。')
  } catch (error) {
    console.error('启用 Custom CSS Hot Reload 时出错:', error)
    showErrorMessage(`启用 Custom CSS Hot Reload 失败: ${error.message}`)
  }
}

/**
 * 启用 Custom CSS
 */
function enableCustomCss() {
  try {
    vscode.commands.executeCommand('extension.updateCustomCSS')
      .then(() => {
        showReloadPrompt('Custom CSS 已启用！VSCode 需要重新加载以应用彩色光标效果。')
      })
      .catch(error => {
        console.error('启用 Custom CSS 失败:', error)

        // 备用方案：提示用户手动启用
        vscode.window.showInformationMessage(
          '[Woodfish Theme] 请手动执行以下步骤启用彩色光标：\n1. 按 Ctrl+Shift+P 打开命令面板\n2. 执行"Enable Custom CSS and JS"命令\n3. 重启 VSCode',
          '打开命令面板'
        ).then(selection => {
          if (selection === '打开命令面板') {
            vscode.commands.executeCommand('workbench.action.showCommands')
          }
        })
      })
  } catch (error) {
    console.error('启用 Custom CSS 时出错:', error)
    showErrorMessage(`启用 Custom CSS 失败: ${error.message}`)
  }
}

/**
 * 显示 Custom CSS 设置指南
 */
function showCustomCssSetupGuide() {
  try {
    const guidePath = path.join(__dirname, 'vscode-custom-css-setup.md')

    if (fs.existsSync(guidePath)) {
      vscode.workspace.openTextDocument(guidePath)
        .then(doc => {
          vscode.window.showTextDocument(doc)
          showInfoMessage('已打开彩色光标设置指南，请按照说明进行配置')
        })
        .catch(error => {
          console.error('打开设置指南失败:', error)
          showErrorMessage(`无法打开设置指南: ${error.message}`)
        })
    } else {
      showErrorMessage('设置指南文件不存在')
    }
  } catch (error) {
    console.error('显示设置指南时出错:', error)
    showErrorMessage(`显示设置指南失败: ${error.message}`)
  }
}

/**
 * 显示 Custom CSS 设置指南
 */
function showCustomCssSetupGuide() {
  try {
    const guidePath = path.join(__dirname, 'vscode-custom-css-setup.md')

    if (fs.existsSync(guidePath)) {
      vscode.workspace.openTextDocument(guidePath)
        .then(doc => {
          vscode.window.showTextDocument(doc)
          showInfoMessage('已打开彩色光标设置指南，请按照说明进行配置')
        })
        .catch(error => {
          console.error('打开设置指南失败:', error)
          showErrorMessage(`无法打开设置指南: ${error.message}`)
        })
    } else {
      showErrorMessage('设置指南文件不存在')
    }
  } catch (error) {
    console.error('显示设置指南时出错:', error)
    showErrorMessage(`显示设置指南失败: ${error.message}`)
  }
}


/**
 * 应用主题样式（通过Custom CSS扩展）
 */
function applyTheme() {
  try {
    console.log('开始应用主题样式（通过Custom CSS扩展）')

    // 配置主题CSS文件
    configureThemeCSS()

    // 更新版本状态
    updateVscodeVersion()

    console.log('主题应用完成')

  } catch (error) {
    showErrorMessage(`应用主题失败: ${error.message}`)
    console.error('应用主题时出错:', error)
  }
}

/**
 * 移除主题样式（从Custom CSS扩展配置中移除）
 */
function removeTheme() {
  try {
    console.log('开始移除主题样式')

    // 检查哪个扩展已安装，然后移除对应的配置
    const isCustomCssInstalled = isCustomCssExtensionInstalled()
    const isHotReloadInstalled = isCustomCssHotReloadExtensionInstalled()

    // 如果两个扩展都没有安装，则提示用户
    if (!isCustomCssInstalled && !isHotReloadInstalled) {
      showInfoMessage('未检测到 Custom CSS 扩展，请先安装扩展后再尝试移除主题')
      return
    }

    // 分别处理两个扩展的配置
    let totalRemovedCount = 0

    if (isCustomCssInstalled) {
      const config = vscode.workspace.getConfiguration()
      const customCssImports = config.get('vscode_custom_css.imports', [])

      // 构建主题CSS文件的路径（用于精确匹配）
      const themeStylePath = path.join(__dirname, 'themes', EXTENSION_CONFIG.themeFileName)
      const themeFileUri = `file:///${themeStylePath.replace(/\\/g, '/')}`

      console.log('尝试从 Custom CSS and JS Loader 移除主题配置，当前导入列表:', customCssImports)
      console.log('目标移除路径:', themeFileUri)

      // 过滤掉主题相关的配置 - 使用更精确的匹配
      const filteredImports = customCssImports.filter(importPath => {
        // 完全匹配文件URI
        if (importPath === themeFileUri) {
          console.log('找到完全匹配的主题路径，将移除:', importPath)
          return false
        }
        // 备用匹配：检查是否包含主题文件标识
        if (importPath.includes('woodfish-theme.css')) {
          console.log('找到包含主题文件标识的路径，将移除:', importPath)
          return false
        }
        return true
      })

      const removedCount = customCssImports.length - filteredImports.length
      console.log(`从 Custom CSS and JS Loader 移除了 ${removedCount} 个主题配置`)

      if (removedCount > 0) {
        config.update('vscode_custom_css.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('主题CSS配置已从 Custom CSS and JS Loader 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS and JS Loader 移除主题配置失败:', error)
            showErrorMessage(`从 Custom CSS and JS Loader 移除主题失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    if (isHotReloadInstalled) {
      const config = vscode.workspace.getConfiguration()
      const hotReloadImports = config.get('custom_css_hot_reload.imports', [])

      // 构建主题CSS文件的路径（用于精确匹配）
      const themeStylePath = path.join(__dirname, 'themes', EXTENSION_CONFIG.themeFileName)
      const themeFileUri = `file:///${themeStylePath.replace(/\\/g, '/')}`

      console.log('尝试从 Custom CSS Hot Reload 移除主题配置，当前导入列表:', hotReloadImports)
      console.log('目标移除路径:', themeFileUri)

      // 过滤掉主题相关的配置 - 使用更精确的匹配
      const filteredImports = hotReloadImports.filter(importPath => {
        // 完全匹配文件URI
        if (importPath === themeFileUri) {
          console.log('找到完全匹配的主题路径，将移除:', importPath)
          return false
        }
        // 备用匹配：检查是否包含主题文件标识
        if (importPath.includes('woodfish-theme.css')) {
          console.log('找到包含主题文件标识的路径，将移除:', importPath)
          return false
        }
        return true
      })

      const removedCount = hotReloadImports.length - filteredImports.length
      console.log(`从 Custom CSS Hot Reload 移除了 ${removedCount} 个主题配置`)

      if (removedCount > 0) {
        config.update('custom_css_hot_reload.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('主题CSS配置已从 Custom CSS Hot Reload 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS Hot Reload 移除主题配置失败:', error)
            showErrorMessage(`从 Custom CSS Hot Reload 移除主题失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    if (totalRemovedCount > 0) {
      console.log(`总共移除了 ${totalRemovedCount} 个主题配置`)
      showReloadPrompt('Woodfish Theme 已成功禁用！VSCode 需要重新加载以应用更改。')
    } else {
      console.log('未找到主题配置，可能已经被移除')
      showInfoMessage('主题配置未找到或已移除')
    }

  } catch (error) {
    showErrorMessage(`移除主题失败: ${error.message}`)
    console.error('移除主题时出错:', error)
  }
}

// ==================== 依赖插件管理函数 ====================

/**
 * 依赖插件配置
 */
const DEPENDENCY_EXTENSION = {
  id: 'BrandonKirbyson.vscode-animations',
  name: 'VSCode Animations',
  description: '为VSCode提供动画效果的插件'
}

/**
 * 检查依赖插件是否已安装
 * @returns {boolean} 是否已安装
 */
function isDependencyExtensionInstalled() {
  try {
    const extension = vscode.extensions.getExtension(DEPENDENCY_EXTENSION.id)
    return Boolean(extension)
  } catch (error) {
    console.error('检查依赖插件时出错:', error)
    return false
  }
}

/**
 * 检查用户是否已经选择过不安装依赖插件
 * @returns {boolean} 是否已选择不安装
 */
function hasUserDeclinedInstallation() {
  if (!extensionContext) return false

  try {
    return extensionContext.globalState.get(`declined-${DEPENDENCY_EXTENSION.id}`, false)
  } catch (error) {
    console.error('检查用户选择状态时出错:', error)
    return false
  }
}

/**
 * 记录用户选择不安装依赖插件
 */
function recordUserDeclinedInstallation() {
  if (!extensionContext) return

  try {
    extensionContext.globalState.update(`declined-${DEPENDENCY_EXTENSION.id}`, true)
    console.log('已记录用户选择不安装依赖插件')
  } catch (error) {
    console.error('记录用户选择时出错:', error)
  }
}

/**
 * 显示依赖插件安装提示
 */
function showInstallPrompt() {
  const installAction = '安装插件'
  const laterAction = '稍后'
  const neverAction = '不再提示'

  const message = `为了获得更好的视觉体验，建议安装 ${DEPENDENCY_EXTENSION.name} 插件。该插件提供丰富的动画效果，与 Woodfish Theme 完美配合。`

  vscode.window
    .showInformationMessage(
      `[Woodfish Theme] ${message}`,
      installAction,
      laterAction,
      neverAction
    )
    .then(selection => {
      switch (selection) {
      case installAction:
        installDependencyExtension()
        break
      case neverAction:
        recordUserDeclinedInstallation()
        showInfoMessage('已记录您的选择，不会再次提示安装此插件')
        break
      case laterAction:
      default:
        // 用户选择稍后或关闭对话框，不做任何操作
        break
      }
    })
}

/**
 * 安装依赖插件
 */
function installDependencyExtension() {
  try {
    // 使用VSCode命令打开插件市场页面
    const extensionUri = vscode.Uri.parse(`vscode:extension/${DEPENDENCY_EXTENSION.id}`)

    vscode.commands.executeCommand('vscode.open', extensionUri)
      .then(() => {
        showInfoMessage(`已打开 ${DEPENDENCY_EXTENSION.name} 插件页面，请点击安装按钮完成安装`)
      })
      .catch(error => {
        console.error('打开插件页面失败:', error)

        // 备用方案：使用浏览器打开插件市场页面
        const marketplaceUrl = `https://marketplace.visualstudio.com/items?itemName=${DEPENDENCY_EXTENSION.id}`
        vscode.env.openExternal(vscode.Uri.parse(marketplaceUrl))
          .then(() => {
            showInfoMessage('已在浏览器中打开插件市场页面，请下载并安装插件')
          })
          .catch(browserError => {
            console.error('打开浏览器失败:', browserError)
            showErrorMessage(`无法自动打开插件页面，请手动搜索安装：${DEPENDENCY_EXTENSION.id}`)
          })
      })
  } catch (error) {
    console.error('安装依赖插件时出错:', error)
    showErrorMessage(`安装插件失败: ${error.message}`)
  }
}

/**
 * 检查并提示安装依赖插件
 */
function checkDependencyExtension() {
  try {
    // 检查插件是否已安装
    if (isDependencyExtensionInstalled()) {
      console.log('依赖插件已安装，无需提示')
      return
    }

    // 检查用户是否已选择不安装
    if (hasUserDeclinedInstallation()) {
      console.log('用户已选择不安装依赖插件，跳过提示')
      return
    }

    // 延迟显示提示，避免与其他启动消息冲突
    setTimeout(() => {
      showInstallPrompt()
    }, 2000)

  } catch (error) {
    console.error('检查依赖插件时出错:', error)
  }
}

// ==================== 版本管理函数 ====================

/**
 * 获取存储的 VSCode 版本
 * @returns {string|undefined} 存储的版本号
 */
function getStoredVscodeVersion() {
  return extensionContext?.globalState.get(EXTENSION_CONFIG.versionKey)
}

/**
 * 更新存储的 VSCode 版本
 */
function updateVscodeVersion() {
  if (!extensionContext) return

  try {
    const currentVersion = vscode.version.split('-')[0]
    extensionContext.globalState.update(EXTENSION_CONFIG.versionKey, currentVersion)
  } catch (error) {
    console.error('更新版本信息时出错:', error)
  }
}

/**
 * 检查是否曾经安装过主题（通过Custom CSS配置检查）
 * @returns {boolean} 是否安装过
 */
function wasThemeInstalled() {
  try {
    const config = vscode.workspace.getConfiguration()
    
    // 检查 Custom CSS and JS Loader 配置
    const customCssImports = config.get('vscode_custom_css.imports', [])
    const isCustomCssConfigured = customCssImports.some(importPath =>
      importPath.includes('woodfish-theme.css')
    )
    
    // 检查 Custom CSS Hot Reload 配置
    const hotReloadImports = config.get('custom_css_hot_reload.imports', [])
    const isHotReloadConfigured = hotReloadImports.some(importPath =>
      importPath.includes('woodfish-theme.css')
    )
    
    // 如果任一扩展配置了主题CSS文件，则返回true
    return isCustomCssConfigured || isHotReloadConfigured
  } catch (error) {
    console.error('检查主题安装状态时出错:', error)
    return false
  }
}

/**
 * 初始化版本检查
 * 当 VSCode 更新时提示用户重新配置主题
 */
function initializeVersionCheck() {
  try {
    const currentVersion = vscode.version.split('-')[0]
    const storedVersion = getStoredVscodeVersion()

    // 如果版本不匹配且之前安装过主题，则提示用户重新配置
    if (currentVersion !== storedVersion && wasThemeInstalled()) {
      console.log('检测到 VSCode 版本更新，提示用户重新配置主题')
      showInfoMessage('检测到VSCode版本更新，建议重新启用Woodfish主题以确保兼容性')
    }
  } catch (error) {
    console.error('版本检查时出错:', error)
  }
}

// ==================== 命令注册函数 ====================

/**
 * 切换发光效果
 */
function toggleGlowEffects() {
  try {
    const themeConfiguration = vscode.workspace.getConfiguration(EXTENSION_CONFIG.configSection)
    const currentGlowState = themeConfiguration.get('enableGlowEffects', true)
    const newGlowState = !currentGlowState

    console.log(`切换发光效果: ${currentGlowState} -> ${newGlowState}`)

    // 更新配置
    themeConfiguration.update('enableGlowEffects', newGlowState, vscode.ConfigurationTarget.Global)
      .then(() => {
        const statusMessage = newGlowState ? '发光效果已开启' : '发光效果已关闭'

        if (newGlowState) {
          // 开启发光效果：重新应用主题
          showInfoMessage(`${statusMessage}！请通过Custom CSS扩展重新加载以查看效果。`)
        } else {
          // 关闭发光效果：移除发光相关的CSS文件
          removeGlowEffectFiles()
          showInfoMessage(`${statusMessage}！发光效果相关文件已移除，请重新加载VSCode。`)
        }
      })
      .catch(error => {
        showErrorMessage(`更新发光效果配置失败: ${error.message}`)
        console.error('更新配置时出错:', error)
      })

  } catch (error) {
    showErrorMessage(`切换发光效果失败: ${error.message}`)
    console.error('切换发光效果时出错:', error)
  }
}

/**
 * 切换毛玻璃效果
 */
function toggleGlassEffect() {
  try {
    const themeConfiguration = vscode.workspace.getConfiguration(EXTENSION_CONFIG.configSection)
    const currentGlassState = themeConfiguration.get('enableGlassEffect', true)
    const newGlassState = !currentGlassState

    console.log(`切换毛玻璃效果: ${currentGlassState} -> ${newGlassState}`)

    // 更新配置
    themeConfiguration.update('enableGlassEffect', newGlassState, vscode.ConfigurationTarget.Global)
      .then(() => {
        const statusMessage = newGlassState ? '毛玻璃效果已开启' : '毛玻璃效果已关闭'
        showInfoMessage(`${statusMessage}！请通过Custom CSS扩展重新加载以查看效果。`)
      })
      .catch(error => {
        showErrorMessage(`更新毛玻璃效果配置失败: ${error.message}`)
        console.error('更新配置时出错:', error)
      })

  } catch (error) {
    showErrorMessage(`切换毛玻璃效果失败: ${error.message}`)
    console.error('切换毛玻璃效果时出错:', error)
  }
}

/**
 * 切换彩色光标效果
 */
function toggleRainbowCursor() {
  try {
    const themeConfiguration = vscode.workspace.getConfiguration(EXTENSION_CONFIG.configSection)
    const currentCursorState = themeConfiguration.get('enableRainbowCursor', false)
    const newCursorState = !currentCursorState

    console.log(`切换彩色光标效果: ${currentCursorState} -> ${newCursorState}`)

    // 更新配置
    themeConfiguration.update('enableRainbowCursor', newCursorState, vscode.ConfigurationTarget.Global)
      .then(() => {
        const statusMessage = newCursorState ? '彩色光标效果已开启' : '彩色光标效果已关闭'

        if (newCursorState) {
          // 开启彩色光标时，自动配置
          autoConfigureRainbowCursor()
        } else {
          // 关闭彩色光标时，移除配置
          removeRainbowCursorConfig()
        }

        showInfoMessage(statusMessage)
      })
      .catch(error => {
        showErrorMessage(`更新彩色光标配置失败: ${error.message}`)
        console.error('更新配置时出错:', error)
      })

  } catch (error) {
    showErrorMessage(`切换彩色光标效果失败: ${error.message}`)
    console.error('切换彩色光标效果时出错:', error)
  }
}

/**
 * 彻底停用Woodfish主题 - 删除所有新旧版本注入文件
 */
function completeUninstall() {
  try {
    console.log('开始彻底停用Woodfish主题...')

    // 显示确认对话框
    const confirmAction = '确认停用'
    const cancelAction = '取消'

    vscode.window
      .showWarningMessage(
        '[Woodfish Theme] 此操作将彻底移除所有Woodfish主题相关文件和配置，包括新旧版本的所有注入文件。是否继续？',
        confirmAction,
        cancelAction
      )
      .then(selection => {
        if (selection === confirmAction) {
          performCompleteUninstall()
        } else {
          showInfoMessage('已取消彻底停用操作')
        }
      })

  } catch (error) {
    showErrorMessage(`彻底停用失败: ${error.message}`)
    console.error('彻底停用时出错:', error)
  }
}

/**
 * 执行彻底卸载操作
 */
function performCompleteUninstall() {
  try {
    console.log('执行彻底卸载操作...')

    // 1. 移除新版本的Custom CSS配置
    removeAllWoodfishCssFromCustomCss()

    // 2. 清理旧版本的HTML注入文件
    cleanOldHtmlInjections()

    // 3. 专门清理光标相关配置
    cleanCursorSpecificConfiguration()

    // 4. 清理扩展配置
    cleanExtensionConfiguration()

    // 4. 检查并清理其他可能的CSS注入
    checkAndCleanOtherCssExtensions()

    // 5. 强制重置光标样式
    forceResetCursorStyle()

    // 6. 提供额外的清理选项
    offerAdditionalCleanupOptions()

    // 5. 显示成功消息和重启提示
    showReloadPrompt('Woodfish主题已彻底停用！所有相关文件和配置已清理，请重新加载VSCode。')

    console.log('彻底卸载操作完成')

  } catch (error) {
    showErrorMessage(`执行彻底卸载失败: ${error.message}`)
    console.error('执行彻底卸载时出错:', error)
  }
}


/**
 * 从Custom CSS配置中移除所有Woodfish相关文件
 */
function removeAllWoodfishCssFromCustomCss() {
  try {
    const config = vscode.workspace.getConfiguration()
    
    // 获取两个扩展的配置
    const customCssImports = config.get('vscode_custom_css.imports', [])
    const hotReloadImports = config.get('custom_css_hot_reload.imports', [])

    // 处理 Custom CSS and JS Loader 配置
    if (customCssImports && customCssImports.length > 0) {
      console.log('清理Custom CSS and JS Loader配置中的Woodfish相关文件...')
      console.log('当前导入列表:', customCssImports)

      // 定义所有Woodfish相关的文件路径（更全面的列表）
      const woodfishRelatedFiles = [
        // 主要主题文件
        path.join(__dirname, 'themes', 'woodfish-theme.css'),
        path.join(__dirname, 'themes', 'woodfish-theme-modular.css'),
        // 模块文件 - 这些是产生渐变和发光效果的核心文件
        path.join(__dirname, 'themes', 'modules', 'glow-effects.css'),
        path.join(__dirname, 'themes', 'modules', 'cursor-animation.css'),
        path.join(__dirname, 'themes', 'modules', 'transparent-ui.css'),
        path.join(__dirname, 'themes', 'modules', 'activity-bar.css'),
        path.join(__dirname, 'themes', 'modules', 'tab-bar.css'),
        path.join(__dirname, 'themes', 'modules', 'syntax-highlighting.css'),
        path.join(__dirname, 'themes', 'modules', 'variables.css'),
        // 自定义CSS文件
        path.join(__dirname, 'custom-css', 'rainbow-cursor.css'),
        path.join(__dirname, 'custom-css', 'cursor-loader.css'),
        // 旧版本可能的文件位置
        path.join(__dirname, 'themes', 'woodfish-theme.html'),
        // 添加更多可能的文件路径
        path.join(__dirname, 'index.css'),
        path.join(__dirname, 'woodfish theme.json')
      ]

      // 构建文件URI列表
      const woodfishFileUris = woodfishRelatedFiles.map(filePath => {
        return `file:///${filePath.replace(/\\/g, '/')}`
      })

      // 扩展关键词匹配模式 - 更全面的匹配，特别针对光标效果
      const woodfishKeywords = [
        'woodfish-theme',
        'glow-effects',
        'cursor-animation',
        'rainbow-cursor',
        'woodfish',
        'syntax-highlighting',
        'transparent-ui',
        'activity-bar',
        'tab-bar',
        'variables.css',
        'cursor-loader',
        // 光标动画相关关键词
        'bp-animation',
        'cursor-hue',
        'rainbow-cursor',
        'cursor-blink',
        'cursors-layer',
        'cursor-secondary',
        '.cursor',
        'monaco-editor .cursor',
        'div.cursor'
      ]

      console.log('要移除的Woodfish相关文件:', woodfishFileUris)

      // 更激进的过滤策略 - 移除任何可能相关的配置
      const filteredImports = customCssImports.filter(importPath => {
        // 检查是否是Woodfish相关文件（完全匹配）
        if (woodfishFileUris.some(woodfishUri => importPath === woodfishUri)) {
          console.log('找到完全匹配的Woodfish路径，将移除:', importPath)
          return false
        }

        // 检查路径中是否包含Woodfish相关关键词（更宽松的匹配）
        if (woodfishKeywords.some(keyword => importPath.toLowerCase().includes(keyword.toLowerCase()))) {
          console.log('找到包含Woodfish关键词的路径，将移除:', importPath)
          return false
        }

        // 检查是否包含在当前扩展目录中的任何CSS文件
        if (importPath.includes(__dirname.replace(/\\/g, '/')) && importPath.includes('.css')) {
          console.log('找到扩展目录中的CSS文件，将移除:', importPath)
          return false
        }

        return true
      })

      const removedCount = customCssImports.length - filteredImports.length
      console.log(`从Custom CSS and JS Loader中移除了 ${removedCount} 个Woodfish相关配置`)

      if (removedCount > 0) {
        config.update('vscode_custom_css.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('Woodfish相关CSS配置已从Custom CSS and JS Loader移除')
          })
          .catch(error => {
            console.error('从Custom CSS and JS Loader移除Woodfish CSS配置失败:', error)
          })
      } else {
        console.log('Custom CSS and JS Loader中未找到Woodfish相关配置')
      }
    }

    // 处理 Custom CSS Hot Reload 配置
    if (hotReloadImports && hotReloadImports.length > 0) {
      console.log('清理Custom CSS Hot Reload配置中的Woodfish相关文件...')
      console.log('当前导入列表:', hotReloadImports)

      // 定义所有Woodfish相关的文件路径（更全面的列表）
      const woodfishRelatedFiles = [
        // 主要主题文件
        path.join(__dirname, 'themes', 'woodfish-theme.css'),
        path.join(__dirname, 'themes', 'woodfish-theme-modular.css'),
        // 模块文件 - 这些是产生渐变和发光效果的核心文件
        path.join(__dirname, 'themes', 'modules', 'glow-effects.css'),
        path.join(__dirname, 'themes', 'modules', 'cursor-animation.css'),
        path.join(__dirname, 'themes', 'modules', 'transparent-ui.css'),
        path.join(__dirname, 'themes', 'modules', 'activity-bar.css'),
        path.join(__dirname, 'themes', 'modules', 'tab-bar.css'),
        path.join(__dirname, 'themes', 'modules', 'syntax-highlighting.css'),
        path.join(__dirname, 'themes', 'modules', 'variables.css'),
        // 自定义CSS文件
        path.join(__dirname, 'custom-css', 'rainbow-cursor.css'),
        path.join(__dirname, 'custom-css', 'cursor-loader.css'),
        // 旧版本可能的文件位置
        path.join(__dirname, 'themes', 'woodfish-theme.html'),
        // 添加更多可能的文件路径
        path.join(__dirname, 'index.css'),
        path.join(__dirname, 'woodfish theme.json')
      ]

      // 构建文件URI列表
      const woodfishFileUris = woodfishRelatedFiles.map(filePath => {
        return `file:///${filePath.replace(/\\/g, '/')}`
      })

      // 扩展关键词匹配模式 - 更全面的匹配，特别针对光标效果
      const woodfishKeywords = [
        'woodfish-theme',
        'glow-effects',
        'cursor-animation',
        'rainbow-cursor',
        'woodfish',
        'syntax-highlighting',
        'transparent-ui',
        'activity-bar',
        'tab-bar',
        'variables.css',
        'cursor-loader',
        // 光标动画相关关键词
        'bp-animation',
        'cursor-hue',
        'rainbow-cursor',
        'cursor-blink',
        'cursors-layer',
        'cursor-secondary',
        '.cursor',
        'monaco-editor .cursor',
        'div.cursor'
      ]

      console.log('要移除的Woodfish相关文件:', woodfishFileUris)

      // 更激进的过滤策略 - 移除任何可能相关的配置
      const filteredImports = hotReloadImports.filter(importPath => {
        // 检查是否是Woodfish相关文件（完全匹配）
        if (woodfishFileUris.some(woodfishUri => importPath === woodfishUri)) {
          console.log('找到完全匹配的Woodfish路径，将移除:', importPath)
          return false
        }

        // 检查路径中是否包含Woodfish相关关键词（更宽松的匹配）
        if (woodfishKeywords.some(keyword => importPath.toLowerCase().includes(keyword.toLowerCase()))) {
          console.log('找到包含Woodfish关键词的路径，将移除:', importPath)
          return false
        }

        // 检查是否包含在当前扩展目录中的任何CSS文件
        if (importPath.includes(__dirname.replace(/\\/g, '/')) && importPath.includes('.css')) {
          console.log('找到扩展目录中的CSS文件，将移除:', importPath)
          return false
        }

        return true
      })

      const removedCount = hotReloadImports.length - filteredImports.length
      console.log(`从Custom CSS Hot Reload中移除了 ${removedCount} 个Woodfish相关配置`)

      if (removedCount > 0) {
        config.update('custom_css_hot_reload.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('Woodfish相关CSS配置已从Custom CSS Hot Reload移除')
          })
          .catch(error => {
            console.error('从Custom CSS Hot Reload移除Woodfish CSS配置失败:', error)
          })
      } else {
        console.log('Custom CSS Hot Reload中未找到Woodfish相关配置')
      }
    }

    // 额外步骤：清空两个扩展的配置以确保完全清理
    if ((customCssImports && customCssImports.length > 0) || (hotReloadImports && hotReloadImports.length > 0)) {
      console.log('准备清空所有Custom CSS配置以确保完全清理...')
      vscode.window
        .showWarningMessage(
          '[Woodfish Theme] 为确保完全移除所有效果，建议清空所有Custom CSS配置。是否继续？',
          '清空所有配置',
          '保持现有配置'
        )
        .then(selection => {
          if (selection === '清空所有配置') {
            // 清空两个扩展的配置
            if (customCssImports && customCssImports.length > 0) {
              config.update('vscode_custom_css.imports', [], vscode.ConfigurationTarget.Global)
                .then(() => {
                  console.log('已清空 Custom CSS and JS Loader 配置')
                })
                .catch(error => {
                  showErrorMessage(`清空Custom CSS and JS Loader配置失败: ${error.message}`)
                })
            }
            
            if (hotReloadImports && hotReloadImports.length > 0) {
              config.update('custom_css_hot_reload.imports', [], vscode.ConfigurationTarget.Global)
                .then(() => {
                  console.log('已清空 Custom CSS Hot Reload 配置')
                })
                .catch(error => {
                  showErrorMessage(`清空Custom CSS Hot Reload配置失败: ${error.message}`)
                })
            }
            
            showInfoMessage('已清空所有Custom CSS配置')
          }
        })
    }

  } catch (error) {
    console.error('清理Custom CSS配置时出错:', error)
  }
}

/**
 * 清理旧版本的HTML注入
 */
function cleanOldHtmlInjections() {
  try {
    console.log('清理旧版本的HTML注入...')

    // 获取VSCode工作区HTML文件路径
    const htmlPath = getWorkbenchHtmlPath()

    if (!htmlPath || !fs.existsSync(htmlPath)) {
      console.log('未找到workbench HTML文件，跳过HTML清理')
      return
    }

    try {
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8')

      // 清理Woodfish主题相关的style和script标签
      const cleanedContent = cleanThemeStyles(htmlContent)

      if (htmlContent !== cleanedContent) {
        // 备份原始文件
        const backupPath = htmlPath + '.woodfish-backup'
        fs.writeFileSync(backupPath, htmlContent)
        console.log(`已备份原始HTML文件到: ${backupPath}`)

        // 写入清理后的内容
        fs.writeFileSync(htmlPath, cleanedContent)
        console.log('已清理HTML文件中的Woodfish注入内容')
      } else {
        console.log('HTML文件中未找到Woodfish注入内容')
      }

    } catch (error) {
      console.error('清理HTML文件时出错:', error)
    }

  } catch (error) {
    console.error('清理旧版本HTML注入时出错:', error)
  }
}

/**
 * 检查并清理其他可能的CSS注入扩展
 */
function checkAndCleanOtherCssExtensions() {
  try {
    console.log('检查其他可能的CSS注入扩展...')

    // 检查常见的CSS注入扩展
    const cssExtensions = [
      'be5invis.vscode-custom-css',  // Custom CSS and JS Loader
      'apc-extension.vscode-apc',    // APC Extension
      'robbowen.vscode-sync-rsync',  // 其他可能修改UI的扩展
      'ms-vscode.vscode-custom-css'  // Microsoft的Custom CSS
    ]

    let foundExtensions = []

    cssExtensions.forEach(extensionId => {
      try {
        const extension = vscode.extensions.getExtension(extensionId)
        if (extension) {
          foundExtensions.push(extensionId)
          console.log(`发现CSS注入扩展: ${extensionId}`)
        }
      } catch (error) {
        console.log(`检查扩展 ${extensionId} 时出错:`, error.message)
      }
    })

    if (foundExtensions.length > 0) {
      vscode.window
        .showWarningMessage(
          `[Woodfish Theme] 发现安装了其他CSS注入扩展：${foundExtensions.join(', ')}。这些扩展可能包含导致残留效果的CSS。是否禁用它们？`,
          '禁用这些扩展',
          '保持启用'
        )
        .then(selection => {
          if (selection === '禁用这些扩展') {
            disableCssExtensions(foundExtensions)
          }
        })
    }

  } catch (error) {
    console.error('检查其他CSS注入扩展时出错:', error)
  }
}

/**
 * 禁用CSS注入扩展
 */
function disableCssExtensions(extensionIds) {
  try {
    console.log('禁用CSS注入扩展:', extensionIds)

    extensionIds.forEach(extensionId => {
      try {
        vscode.commands.executeCommand('workbench.extensions.disableExtension', extensionId)
          .then(() => {
            console.log(`已禁用扩展: ${extensionId}`)
          })
          .catch(error => {
            console.error(`禁用扩展 ${extensionId} 失败:`, error)
          })
      } catch (error) {
        console.error(`禁用扩展 ${extensionId} 时出错:`, error)
      }
    })

    showInfoMessage('已请求禁用相关CSS注入扩展，请重新加载VSCode以生效')

  } catch (error) {
    console.error('禁用CSS注入扩展时出错:', error)
  }
}

/**
 * 强制重置光标样式
 */
function forceResetCursorStyle() {
  try {
    console.log('强制重置光标样式...')

    // 创建并注入重置光标样式的CSS
    const resetCursorCss = `
      /* Woodfish主题光标重置样式 */
      .monaco-editor .cursor,
      .monaco-editor .cursors-layer .cursor,
      div.cursor,
      .cursor {
        background: none !important;
        background-color: #ffffff !important;
        background-image: none !important;
        animation: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        filter: none !important;
        transform: none !important;
        transition: none !important;
        background-size: auto !important;
        background-position: auto !important;
      }

      /* 重置光标动画 */
      @keyframes bp-animation {
        0% { background-position: 0% 0%; }
        100% { background-position: 0% 0%; }
      }

      @keyframes rainbow-cursor {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(0deg); }
      }

      @keyframes cursor-hue {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(0deg); }
      }

      @keyframes cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 1; }
      }

      /* 重置多光标样式 */
      .monaco-editor .cursor-secondary {
        background: #ffffff !important;
        animation: none !important;
        box-shadow: none !important;
      }

      /* 重置光标悬停效果 */
      .monaco-editor:hover .cursor {
        transform: none !important;
        transition: none !important;
      }

      /* 重置输入时的光标效果 */
      .monaco-editor.focused .cursor {
        animation-duration: normal !important;
        box-shadow: none !important;
      }
    `

    // 将重置样式注入到Custom CSS配置中
    const config = vscode.workspace.getConfiguration()
    const customCssImports = config.get('vscode_custom_css.imports', [])

    // 创建临时重置文件
    const resetFilePath = path.join(__dirname, 'cursor-reset.css')
    fs.writeFileSync(resetFilePath, resetCursorCss)
    const resetFileUri = `file:///${resetFilePath.replace(/\\/g, '/')}`

    // 添加到Custom CSS导入列表
    const newImports = [...customCssImports, resetFileUri]

    config.update('vscode_custom_css.imports', newImports, vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('已注入光标重置样式')
        showInfoMessage('已强制重置光标样式为默认白色')

        // 延迟清理重置文件，确保应用后再清理
        setTimeout(() => {
          if (fs.existsSync(resetFilePath)) {
            fs.unlinkSync(resetFilePath)
            console.log('已清理临时重置文件')
          }
        }, 5000)
      })
      .catch(error => {
        console.error('注入光标重置样式失败:', error)
      })

  } catch (error) {
    console.error('强制重置光标样式时出错:', error)
  }
}

/**
 * 提供额外的清理选项
 */
function offerAdditionalCleanupOptions() {
  try {
    console.log('提供额外的清理选项...')

    // 询问用户是否需要重置VSCode主题设置
    const resetThemeAction = '重置VSCode主题设置'
    const skipAction = '跳过'

    vscode.window
      .showInformationMessage(
        '[Woodfish Theme] 为确保完全移除效果，建议重置VSCode的主题相关设置。是否继续？',
        resetThemeAction,
        skipAction
      )
      .then(selection => {
        if (selection === resetThemeAction) {
          resetVSCodeThemeSettings()
        }
      })

  } catch (error) {
    console.error('提供额外清理选项时出错:', error)
  }
}

/**
 * 重置VSCode主题设置
 */
function resetVSCodeThemeSettings() {
  try {
    console.log('重置VSCode主题设置...')

    const config = vscode.workspace.getConfiguration()

    // 重置颜色主题
    config.update('workbench.colorTheme', 'Default Dark+', vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('颜色主题已重置为Default Dark+')
      })
      .catch(error => {
        console.error('重置颜色主题失败:', error)
      })

    // 重置文件图标主题
    config.update('workbench.iconTheme', 'vs-seti', vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('文件图标主题已重置为vs-seti')
      })
      .catch(error => {
        console.error('重置文件图标主题失败:', error)
      })

    // 重置产品图标主题
    config.update('workbench.productIconTheme', 'Default', vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('产品图标主题已重置为Default')
      })
      .catch(error => {
        console.error('重置产品图标主题失败:', error)
      })

    showInfoMessage('VSCode主题设置已重置为默认值')

  } catch (error) {
    console.error('重置VSCode主题设置时出错:', error)
  }
}

/**
 * 专门清理光标相关配置
 */
function cleanCursorSpecificConfiguration() {
  try {
    console.log('开始专门清理光标相关配置...')

    const config = vscode.workspace.getConfiguration()

    // 1. 重置VSCode光标设置
    const cursorSettings = [
      'editor.cursorStyle',
      'editor.cursorWidth',
      'editor.cursorBlinking',
      'editor.cursorSmoothCaretAnimation',
      'editor.cursorSurroundingLines'
    ]

    cursorSettings.forEach(setting => {
      config.update(setting, undefined, vscode.ConfigurationTarget.Global)
        .then(() => {
          console.log(`已重置光标设置: ${setting}`)
        })
        .catch(error => {
          console.error(`重置光标设置 ${setting} 失败:`, error)
        })
    })

    // 2. 清理工作区级别的光标配置
    const workspaceCursorSettings = [
      'workbench.colorCustomizations'
    ]

    workspaceCursorSettings.forEach(setting => {
      config.update(setting, undefined, vscode.ConfigurationTarget.Workspace)
        .then(() => {
          console.log(`已清理工作区设置: ${setting}`)
        })
        .catch(error => {
          console.error(`清理工作区设置 ${setting} 失败:`, error)
        })
    })

    // 3. 重置颜色自定义中的光标颜色
    const colorCustomizations = config.get('workbench.colorCustomizations', {})
    const cleanedColorCustomizations = {}

    // 只保留非光标相关的颜色设置
    Object.keys(colorCustomizations).forEach(key => {
      if (!key.toLowerCase().includes('cursor')) {
        cleanedColorCustomizations[key] = colorCustomizations[key]
      } else {
        console.log(`移除了光标颜色设置: ${key}`)
      }
    })

    config.update('workbench.colorCustomizations', cleanedColorCustomizations, vscode.ConfigurationTarget.Global)
      .then(() => {
        console.log('已清理光标颜色自定义')
      })
      .catch(error => {
        console.error('清理光标颜色自定义失败:', error)
      })

    // 4. 清理特定于Woodfish主题的配置
    const woodfishSpecificSettings = [
      'woodfishTheme.enableRainbowCursor',
      'woodfishTheme.enableGlowEffects',
      'woodfishTheme.enableGlassEffect'
    ]

    woodfishSpecificSettings.forEach(setting => {
      config.update(setting, false, vscode.ConfigurationTarget.Global)
        .then(() => {
          console.log(`已禁用Woodfish设置: ${setting}`)
        })
        .catch(error => {
          console.error(`禁用Woodfish设置 ${setting} 失败:`, error)
        })
    })

    console.log('光标相关配置清理完成')

  } catch (error) {
    console.error('清理光标相关配置时出错:', error)
  }
}

/**
 * 清理扩展配置
 */
function cleanExtensionConfiguration() {
  try {
    console.log('清理扩展配置...')

    if (!extensionContext) return

    // 清理版本信息
    extensionContext.globalState.update(EXTENSION_CONFIG.versionKey, undefined)

    // 清理用户拒绝安装依赖插件的记录
    extensionContext.globalState.update(`declined-${DEPENDENCY_EXTENSION.id}`, undefined)

    console.log('扩展配置已清理')

  } catch (error) {
    console.error('清理扩展配置时出错:', error)
  }
}

/**
 * 获取VSCode工作区HTML文件路径（兼容旧版本）
 */
function getWorkbenchHtmlPath() {
  try {
    const appDirectory = require.main ? path.dirname(require.main.filename) : globalThis._VSCODE_FILE_ROOT
    const baseDirectory = path.join(appDirectory, 'vs', 'code')

    const possiblePaths = [
      path.join(baseDirectory, 'electron-sandbox', 'workbench', 'workbench.html'),
      path.join(baseDirectory, 'electron-sandbox', 'workbench', 'workbench-apc-extension.html'),
      path.join(baseDirectory, 'electron-sandbox', 'workbench', 'workbench.esm.html'),
      path.join(baseDirectory, 'electron-browser', 'workbench', 'workbench.esm.html'),
      path.join(baseDirectory, 'electron-browser', 'workbench', 'workbench.html')
    ]

    for (const htmlPath of possiblePaths) {
      if (fs.existsSync(htmlPath)) {
        return htmlPath
      }
    }

    return null
  } catch (error) {
    console.error('获取workbench HTML路径时出错:', error)
    return null
  }
}

/**
 * 清理HTML文件中的主题样式（兼容旧版本）
 */
function cleanThemeStyles(htmlContent) {
  try {
    console.log('开始清理HTML文件中的主题样式...')

    let cleanedContent = htmlContent
    let removedCount = 0

    // 1. 清理Woodfish主题相关的style标签（标准方式）
    const styleRegex = new RegExp(
      `<style[^>]*${EXTENSION_CONFIG.tagAttribute}[^>]*>[\\s\\S]*?</style>`,
      'gi'
    )

    // 2. 清理Woodfish主题相关的script标签
    const scriptRegex = new RegExp(
      `<script[^>]*${EXTENSION_CONFIG.tagAttribute}[^>]*>[\\s\\S]*?</script>`,
      'gi'
    )

    // 3. 清理所有包含woodfish关键词的style标签（更激进的清理）
    const woodfishStyleRegex = /<style[^>]*(?:woodfish|glow|gradient|rainbow|cursor|animation)[^>]*>[\s\S]*?<\/style>/gi

    // 4. 清理所有包含woodfish关键词的script标签
    const woodfishScriptRegex = /<script[^>]*(?:woodfish|glow|gradient|rainbow|cursor|animation)[^>]*>[\s\S]*?<\/script>/gi

    // 5. 清理内联样式中包含woodfish相关内容的标签
    const inlineStyleRegex = /<[^>]+style="[^"]*(?:woodfish|glow|gradient|rainbow|cursor|animation)[^"]*"[^>]*>/gi

    // 6. 专门清理光标相关的CSS（最激进的清理）
    const cursorCssRegex = /[^{}]*\.cursor[^{}]*\{[^{}]*\}/gi
    const cursorAnimationRegex = /@keyframes\s+(?:rainbow-cursor|bp-animation|cursor-hue|cursor-blink)[^{]*\{[^{}]*\}/gi
    const cursorDivRegex = /div\.cursor[^{]*\{[^{}]*\}/gi
    const monacoCursorRegex = /\.monaco-editor[^{]*\.cursor[^{]*\{[^{}]*\}/gi

    // 应用所有清理规则
    const rules = [
      { name: '标准style标签', regex: styleRegex },
      { name: '标准script标签', regex: scriptRegex },
      { name: 'woodfish相关style标签', regex: woodfishStyleRegex },
      { name: 'woodfish相关script标签', regex: woodfishScriptRegex },
      { name: '内联样式', regex: inlineStyleRegex },
      { name: '光标CSS规则', regex: cursorCssRegex },
      { name: '光标动画关键帧', regex: cursorAnimationRegex },
      { name: 'div.cursor规则', regex: cursorDivRegex },
      { name: 'monaco光标规则', regex: monacoCursorRegex }
    ]

    rules.forEach(rule => {
      const beforeLength = cleanedContent.length
      cleanedContent = cleanedContent.replace(rule.regex, (match) => {
        removedCount++
        console.log(`移除了${rule.name}: ${match.substring(0, 150)}...`)
        return ''
      })
      const afterLength = cleanedContent.length
      if (beforeLength !== afterLength) {
        console.log(`${rule.name}清理完成，移除了 ${beforeLength - afterLength} 字符`)
      }
    })

    // 7. 清理任何包含CSS变量的内容（针对渐变和发光效果）
    const cssVarsRegex = /(?:--gradient-|--glow-|text-shadow:\s*0\s+0\s+\d+px\s+currentColor)[^;]*;?/gi
    cleanedContent = cleanedContent.replace(cssVarsRegex, (match) => {
      console.log(`移除了CSS变量: ${match}`)
      return ''
    })

    // 8. 清理linear-gradient相关内容
    const gradientRegex = /linear-gradient\([^)]*\)/gi
    cleanedContent = cleanedContent.replace(gradientRegex, (match) => {
      if (match.includes('cursor') || match.includes('rainbow') || match.includes('#ff')) {
        console.log(`移除了渐变效果: ${match}`)
        return 'transparent'
      }
      return match
    })

    // 9. 清理background-size中光标相关的内容
    const bgSizeRegex = /background-size:\s*\d+%\s*\d+%/gi
    cleanedContent = cleanedContent.replace(bgSizeRegex, (match) => {
      if (cleanedContent.includes('cursor') && (match.includes('800%') || match.includes('1200%'))) {
        console.log(`移除了光标背景尺寸: ${match}`)
        return 'background-size: auto'
      }
      return match
    })

    console.log(`HTML样式清理完成，共移除 ${removedCount} 处内容`)

    return cleanedContent
  } catch (error) {
    console.error('清理主题样式时出错:', error)
    return htmlContent
  }
}

/**
 * 移除发光效果相关的CSS文件
 */
function removeGlowEffectFiles() {
  try {
    // 检查哪个扩展已安装，然后移除对应的配置
    const isCustomCssInstalled = isCustomCssExtensionInstalled()
    const isHotReloadInstalled = isCustomCssHotReloadExtensionInstalled()

    // 如果两个扩展都没有安装，则提示用户
    if (!isCustomCssInstalled && !isHotReloadInstalled) {
      showInfoMessage('未检测到 Custom CSS 扩展，请先安装扩展后再尝试移除发光效果')
      return
    }

    let totalRemovedCount = 0

    // 处理 Custom CSS and JS Loader 扩展
    if (isCustomCssInstalled) {
      const config = vscode.workspace.getConfiguration()
      const customCssImports = config.get('vscode_custom_css.imports', [])

      console.log('开始从 Custom CSS and JS Loader 移除发光效果相关文件...')
      console.log('当前导入列表:', customCssImports)

      // 定义发光效果相关的文件路径
      const glowRelatedFiles = [
        // 主要发光效果文件
        path.join(__dirname, 'themes', 'modules', 'glow-effects.css'),
        // 主主题文件（包含发光效果）
        path.join(__dirname, 'themes', 'woodfish-theme.css'),
        // 模块化主题文件（导入发光效果）
        path.join(__dirname, 'themes', 'woodfish-theme-modular.css')
      ]

      // 构建文件URI列表
      const glowFileUris = glowRelatedFiles.map(filePath => {
        return `file:///${filePath.replace(/\\/g, '/')}`
      })

      console.log('要移除的发光效果文件:', glowFileUris)

      // 过滤掉发光效果相关的配置
      const filteredImports = customCssImports.filter(importPath => {
        // 检查是否是发光效果相关文件
        const isGlowRelated = glowFileUris.some(glowUri => importPath === glowUri) ||
                             // 检查路径中是否包含发光效果相关关键词
                             importPath.includes('glow-effects.css') ||
                             importPath.includes('woodfish-theme.css') ||
                             importPath.includes('woodfish-theme-modular.css')

        if (isGlowRelated) {
          console.log('找到发光效果相关路径，将移除:', importPath)
          return false
        }

        return true
      })

      const removedCount = customCssImports.length - filteredImports.length
      console.log(`从 Custom CSS and JS Loader 移除了 ${removedCount} 个发光效果相关配置`)

      if (removedCount > 0) {
        config.update('vscode_custom_css.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('发光效果相关CSS配置已从 Custom CSS and JS Loader 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS and JS Loader 移除发光效果配置失败:', error)
            showErrorMessage(`从 Custom CSS and JS Loader 移除发光效果配置失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    // 处理 Custom CSS Hot Reload 扩展
    if (isHotReloadInstalled) {
      const config = vscode.workspace.getConfiguration()
      const hotReloadImports = config.get('custom_css_hot_reload.imports', [])

      console.log('开始从 Custom CSS Hot Reload 移除发光效果相关文件...')
      console.log('当前导入列表:', hotReloadImports)

      // 定义发光效果相关的文件路径
      const glowRelatedFiles = [
        // 主要发光效果文件
        path.join(__dirname, 'themes', 'modules', 'glow-effects.css'),
        // 主主题文件（包含发光效果）
        path.join(__dirname, 'themes', 'woodfish-theme.css'),
        // 模块化主题文件（导入发光效果）
        path.join(__dirname, 'themes', 'woodfish-theme-modular.css')
      ]

      // 构建文件URI列表
      const glowFileUris = glowRelatedFiles.map(filePath => {
        return `file:///${filePath.replace(/\\/g, '/')}`
      })

      console.log('要移除的发光效果文件:', glowFileUris)

      // 过滤掉发光效果相关的配置
      const filteredImports = hotReloadImports.filter(importPath => {
        // 检查是否是发光效果相关文件
        const isGlowRelated = glowFileUris.some(glowUri => importPath === glowUri) ||
                             // 检查路径中是否包含发光效果相关关键词
                             importPath.includes('glow-effects.css') ||
                             importPath.includes('woodfish-theme.css') ||
                             importPath.includes('woodfish-theme-modular.css')

        if (isGlowRelated) {
          console.log('找到发光效果相关路径，将移除:', importPath)
          return false
        }

        return true
      })

      const removedCount = hotReloadImports.length - filteredImports.length
      console.log(`从 Custom CSS Hot Reload 移除了 ${removedCount} 个发光效果相关配置`)

      if (removedCount > 0) {
        config.update('custom_css_hot_reload.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('发光效果相关CSS配置已从 Custom CSS Hot Reload 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS Hot Reload 移除发光效果配置失败:', error)
            showErrorMessage(`从 Custom CSS Hot Reload 移除发光效果配置失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    if (totalRemovedCount > 0) {
      console.log(`总共移除了 ${totalRemovedCount} 个发光效果相关配置`)
    } else {
      console.log('未找到发光效果相关配置')
    }

  } catch (error) {
    console.error('移除发光效果文件时出错:', error)
    showErrorMessage(`移除发光效果文件失败: ${error.message}`)
  }
}

/**
 * 移除彩色光标配置
 */
function removeRainbowCursorConfig() {
  try {
    // 检查哪个扩展已安装，然后移除对应的配置
    const isCustomCssInstalled = isCustomCssExtensionInstalled()
    const isHotReloadInstalled = isCustomCssHotReloadExtensionInstalled()

    // 如果两个扩展都没有安装，则提示用户
    if (!isCustomCssInstalled && !isHotReloadInstalled) {
      showInfoMessage('未检测到 Custom CSS 扩展，请先安装扩展后再尝试移除彩色光标配置')
      return
    }

    let totalRemovedCount = 0

    // 处理 Custom CSS and JS Loader 扩展
    if (isCustomCssInstalled) {
      const config = vscode.workspace.getConfiguration()
      const customCssImports = config.get('vscode_custom_css.imports', [])

      // 构建彩色光标 CSS 文件的路径（用于精确匹配）
      const rainbowCursorPath = path.join(__dirname, 'custom-css', 'rainbow-cursor.css')
      const fileUri = `file:///${rainbowCursorPath.replace(/\\/g, '/')}`

      console.log('尝试从 Custom CSS and JS Loader 移除彩色光标配置，当前导入列表:', customCssImports)
      console.log('目标移除路径:', fileUri)

      // 过滤掉彩色光标相关的配置 - 使用更精确的匹配
      const filteredImports = customCssImports.filter(importPath => {
        // 完全匹配文件URI
        if (importPath === fileUri) {
          console.log('找到完全匹配的路径，将移除:', importPath)
          return false
        }
        // 备用匹配：检查是否包含彩虹光标文件标识
        if (importPath.includes('rainbow-cursor.css')) {
          console.log('找到包含彩虹光标标识的路径，将移除:', importPath)
          return false
        }
        return true
      })

      const removedCount = customCssImports.length - filteredImports.length
      console.log(`从 Custom CSS and JS Loader 移除了 ${removedCount} 个彩色光标配置`)

      if (removedCount > 0) {
        config.update('vscode_custom_css.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('彩色光标配置已从 Custom CSS and JS Loader 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS and JS Loader 移除彩色光标配置失败:', error)
            showErrorMessage(`从 Custom CSS and JS Loader 移除彩色光标配置失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    // 处理 Custom CSS Hot Reload 扩展
    if (isHotReloadInstalled) {
      const config = vscode.workspace.getConfiguration()
      const hotReloadImports = config.get('custom_css_hot_reload.imports', [])

      // 构建彩色光标 CSS 文件的路径（用于精确匹配）
      const rainbowCursorPath = path.join(__dirname, 'custom-css', 'rainbow-cursor.css')
      const fileUri = `file:///${rainbowCursorPath.replace(/\\/g, '/')}`

      console.log('尝试从 Custom CSS Hot Reload 移除彩色光标配置，当前导入列表:', hotReloadImports)
      console.log('目标移除路径:', fileUri)

      // 过滤掉彩色光标相关的配置 - 使用更精确的匹配
      const filteredImports = hotReloadImports.filter(importPath => {
        // 完全匹配文件URI
        if (importPath === fileUri) {
          console.log('找到完全匹配的路径，将移除:', importPath)
          return false
        }
        // 备用匹配：检查是否包含彩虹光标文件标识
        if (importPath.includes('rainbow-cursor.css')) {
          console.log('找到包含彩虹光标标识的路径，将移除:', importPath)
          return false
        }
        return true
      })

      const removedCount = hotReloadImports.length - filteredImports.length
      console.log(`从 Custom CSS Hot Reload 移除了 ${removedCount} 个彩色光标配置`)

      if (removedCount > 0) {
        config.update('custom_css_hot_reload.imports', filteredImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('彩色光标配置已从 Custom CSS Hot Reload 移除')
          })
          .catch(error => {
            console.error('从 Custom CSS Hot Reload 移除彩色光标配置失败:', error)
            showErrorMessage(`从 Custom CSS Hot Reload 移除彩色光标配置失败: ${error.message}`)
          })

        totalRemovedCount += removedCount
      }
    }

    const extensionName = isCustomCssInstalled && isHotReloadInstalled ? 
      'Custom CSS and JS Loader 和 Custom CSS Hot Reload' : 
      (isCustomCssInstalled ? 'Custom CSS and JS Loader' : 'Custom CSS Hot Reload')

    if (totalRemovedCount > 0) {
      console.log(`总共移除了 ${totalRemovedCount} 个彩色光标配置`)
      showReloadPrompt(`彩色光标配置已从 ${extensionName} 移除！VSCode 需要重新加载以应用更改。`)
    } else {
      console.log('未找到彩色光标配置，可能已经被移除')
      showInfoMessage('彩色光标配置未找到或已移除')
    }
  } catch (error) {
    console.error('移除彩色光标配置时出错:', error)
    showErrorMessage(`移除彩色光标配置失败: ${error.message}`)
  }
}

/**
 * 注册扩展命令
 */
function registerCommands() {
  if (!extensionContext) return

  try {
    // 启用主题命令
    const enableCommand = vscode.commands.registerCommand(
      'woodfish-theme.enable',
      () => {
        console.log('执行启用主题命令')

        // 应用主题（通过Custom CSS扩展）
        applyTheme()

        // 配置彩色光标
        setTimeout(() => {
          autoConfigureRainbowCursor()
        }, 1000)
      }
    )

    // 禁用主题命令
    const disableCommand = vscode.commands.registerCommand(
      'woodfish-theme.disable',
      () => {
        console.log('执行禁用主题命令')
        removeTheme()
      }
    )

    // 切换发光效果命令
    const toggleGlowCommand = vscode.commands.registerCommand(
      'woodfish-theme.toggleGlow',
      () => {
        console.log('执行切换发光效果命令')
        toggleGlowEffects()
      }
    )

    // 彩色光标自动配置命令
    const autoConfigureRainbowCursorCommand = vscode.commands.registerCommand(
      'woodfish-theme.autoConfigureRainbowCursor',
      () => {
        console.log('执行彩色光标自动配置命令')
        autoConfigureRainbowCursor()
      }
    )

    // 切换毛玻璃效果命令
    const toggleGlassEffectCommand = vscode.commands.registerCommand(
      'woodfish-theme.toggleGlassEffect',
      () => {
        console.log('执行切换毛玻璃效果命令')
        toggleGlassEffect()
      }
    )

    // 切换彩色光标命令
    const toggleRainbowCursorCommand = vscode.commands.registerCommand(
      'woodfish-theme.toggleRainbowCursor',
      () => {
        console.log('执行切换彩色光标命令')
        toggleRainbowCursor()
      }
    )

    // 彻底停用主题命令
    const completeUninstallCommand = vscode.commands.registerCommand(
      'woodfish-theme.completeUninstall',
      () => {
        console.log('执行彻底停用Woodfish主题命令')
        completeUninstall()
      }
    )

    // 注册到扩展上下文
    extensionContext.subscriptions.push(
      enableCommand,
      disableCommand,
      toggleGlowCommand,
      autoConfigureRainbowCursorCommand,
      toggleGlassEffectCommand,
      toggleRainbowCursorCommand,
      completeUninstallCommand
    )

    console.log('主题命令注册成功')
  } catch (error) {
    console.error('注册命令时出错:', error)
  }
}

// ==================== 配置监听函数 ====================

/**
 * 注册配置变化监听器
 */
function registerConfigurationListener() {
  if (!extensionContext) return

  try {
    // 监听配置变化
    const configListener = vscode.workspace.onDidChangeConfiguration(event => {
      // 检查是否是发光效果配置的变化
      if (event.affectsConfiguration(`${EXTENSION_CONFIG.configSection}.enableGlowEffects`)) {
        console.log('配置监听器检测到发光效果配置变化')
        showInfoMessage('发光效果配置已更新，请通过Custom CSS扩展重新加载以查看效果')
      }

      // 检查是否是毛玻璃效果配置的变化
      if (event.affectsConfiguration(`${EXTENSION_CONFIG.configSection}.enableGlassEffect`)) {
        console.log('配置监听器检测到毛玻璃效果配置变化')
        showInfoMessage('毛玻璃效果配置已更新，请通过Custom CSS扩展重新加载以查看效果')
      }

      // 检查是否是彩色光标配置的变化
      if (event.affectsConfiguration(`${EXTENSION_CONFIG.configSection}.enableRainbowCursor`)) {
        console.log('配置监听器检测到彩色光标配置变化')
        // 彩色光标的处理由 toggleRainbowCursor() 函数直接处理
      }
    })

    // 注册到扩展上下文
    extensionContext.subscriptions.push(configListener)

    console.log('配置变化监听器注册成功')
  } catch (error) {
    console.error('注册配置监听器时出错:', error)
  }
}

// ==================== 扩展生命周期函数 ====================

/**
 * 扩展激活函数
 * @param {vscode.ExtensionContext} context 扩展上下文
 */
function activate(context) {
  try {
    // 设置全局上下文
    extensionContext = context

    // 注册命令
    registerCommands()

    // 注册配置变化监听器
    registerConfigurationListener()

    // 初始化版本检查
    initializeVersionCheck()

    // 检查依赖插件
    checkDependencyExtension()

    // 延迟验证CSS配置（避免与其他扩展冲突）
    setTimeout(() => {
      validateAndCleanupCssImports()
    }, 5000)

    console.log('Woodfish Theme 扩展已成功激活')

    // 显示激活消息（仅在开发模式下）
    if (context.extensionMode === vscode.ExtensionMode.Development) {
      showInfoMessage('扩展已在开发模式下激活')
    }

  } catch (error) {
    console.error('激活扩展时出错:', error)
    showErrorMessage(`扩展激活失败: ${error.message}`)
  }
}

/**
 * 扩展停用函数
 */
function deactivate() {
  try {
    console.log('Woodfish Theme 扩展已停用')

    // 清理全局变量
    extensionContext = null

  } catch (error) {
    console.error('停用扩展时出错:', error)
  }
}

// ==================== CSS配置验证和清理函数 ====================

/**
 * 验证和清理CSS导入配置
 * 移除重复项和不存在的文件路径
 */
function validateAndCleanupCssImports() {
  try {
    const config = vscode.workspace.getConfiguration()
    
    // 检查 Custom CSS and JS Loader 配置
    const customCssImports = config.get('vscode_custom_css.imports', [])
    // 检查 Custom CSS Hot Reload 配置
    const hotReloadImports = config.get('custom_css_hot_reload.imports', [])

    // 验证和清理 Custom CSS and JS Loader 配置
    if (customCssImports && customCssImports.length > 0) {
      console.log('开始验证和清理 Custom CSS and JS Loader 配置...')
      console.log(`当前配置数量: ${customCssImports.length}`)

      // 去重和验证
      const validImports = []
      const seenPaths = new Set()

      for (const importPath of customCssImports) {
        if (!importPath || typeof importPath !== 'string') {
          console.log('跳过无效路径:', importPath)
          continue
        }

        // 跳过重复路径
        if (seenPaths.has(importPath)) {
          console.log('跳过重复路径:', importPath)
          continue
        }

        // 验证文件是否存在（仅对本地文件路径）
        if (importPath.startsWith('file:///')) {
          try {
            const filePath = importPath.replace('file:///', '')
            const normalizedPath = filePath.replace(/\//g, '\\') // Windows路径转换
            const fullPath = path.isAbsolute(normalizedPath) ? normalizedPath : path.join(__dirname, normalizedPath)

            if (!fs.existsSync(fullPath)) {
              console.log('文件不存在，将移除:', importPath)
              console.log('尝试访问的路径:', fullPath)
              continue
            }
          } catch (error) {
            console.log('验证文件存在性时出错，保留路径:', importPath, error.message)
          }
        }

        validImports.push(importPath)
        seenPaths.add(importPath)
      }

      const removedCount = customCssImports.length - validImports.length

      if (removedCount > 0) {
        console.log(`Custom CSS and JS Loader 清理完成: 移除了 ${removedCount} 个无效配置，保留了 ${validImports.length} 个有效配置`)

        config.update('vscode_custom_css.imports', validImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('Custom CSS and JS Loader CSS导入配置已更新')
          })
          .catch(error => {
            console.error('更新 Custom CSS and JS Loader CSS配置失败:', error)
          })
      } else {
        console.log('Custom CSS and JS Loader 所有配置都有效，无需清理')
      }
    }

    // 验证和清理 Custom CSS Hot Reload 配置
    if (hotReloadImports && hotReloadImports.length > 0) {
      console.log('开始验证和清理 Custom CSS Hot Reload 配置...')
      console.log(`当前配置数量: ${hotReloadImports.length}`)

      // 去重和验证
      const validImports = []
      const seenPaths = new Set()

      for (const importPath of hotReloadImports) {
        if (!importPath || typeof importPath !== 'string') {
          console.log('跳过无效路径:', importPath)
          continue
        }

        // 跳过重复路径
        if (seenPaths.has(importPath)) {
          console.log('跳过重复路径:', importPath)
          continue
        }

        // 验证文件是否存在（仅对本地文件路径）
        if (importPath.startsWith('file:///')) {
          try {
            const filePath = importPath.replace('file:///', '')
            const normalizedPath = filePath.replace(/\//g, '\\') // Windows路径转换
            const fullPath = path.isAbsolute(normalizedPath) ? normalizedPath : path.join(__dirname, normalizedPath)

            if (!fs.existsSync(fullPath)) {
              console.log('文件不存在，将移除:', importPath)
              console.log('尝试访问的路径:', fullPath)
              continue
            }
          } catch (error) {
            console.log('验证文件存在性时出错，保留路径:', importPath, error.message)
          }
        }

        validImports.push(importPath)
        seenPaths.add(importPath)
      }

      const removedCount = hotReloadImports.length - validImports.length

      if (removedCount > 0) {
        console.log(`Custom CSS Hot Reload 清理完成: 移除了 ${removedCount} 个无效配置，保留了 ${validImports.length} 个有效配置`)

        config.update('custom_css_hot_reload.imports', validImports, vscode.ConfigurationTarget.Global)
          .then(() => {
            console.log('Custom CSS Hot Reload CSS导入配置已更新')
          })
          .catch(error => {
            console.error('更新 Custom CSS Hot Reload CSS配置失败:', error)
          })
      } else {
        console.log('Custom CSS Hot Reload 所有配置都有效，无需清理')
      }
    }

  } catch (error) {
    console.error('验证CSS配置时出错:', error)
  }
}

// ==================== 模块导出 ====================

module.exports = {
  activate,
  deactivate
}
