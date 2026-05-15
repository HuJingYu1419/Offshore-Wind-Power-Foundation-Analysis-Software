/**
 * @filepath: js/utils/fileSaver.js
 * @description: 跨平台文件保存工具 - 自动适配浏览器和 Tauri 环境
 *               修复 Tauri v2 图片保存问题
 */

// ========== 环境检测 ==========

function isTauriEnvironment() {
    return !!(window.__TAURI__ || window.__TAURI_INTERNALS__);
}

function isTauriApiAvailable() {
    if (!isTauriEnvironment()) return false;
    try {
        return typeof window.__TAURI__ !== 'undefined' || 
               typeof window.__TAURI_INTERNALS__ !== 'undefined';
    } catch (e) {
        return false;
    }
}

// ========== 公共导出函数 ==========

export async function saveTextFile(content, defaultFilename) {
    if (isTauriEnvironment() && isTauriApiAvailable()) {
        try {
            return await saveTextFileTauri(content, defaultFilename);
        } catch (error) {
            console.error('Tauri 保存失败，降级到浏览器:', error);
            return saveTextFileBrowser(content, defaultFilename);
        }
    } else {
        return saveTextFileBrowser(content, defaultFilename);
    }
}

export async function saveImageFile(imageDataUrl, defaultFilename) {
    if (isTauriEnvironment() && isTauriApiAvailable()) {
        try {
            return await saveImageFileTauri(imageDataUrl, defaultFilename);
        } catch (error) {
            console.error('Tauri 保存图片失败，降级到浏览器:', error);
            return saveImageFileBrowser(imageDataUrl, defaultFilename);
        }
    } else {
        return saveImageFileBrowser(imageDataUrl, defaultFilename);
    }
}

export async function saveBlobFile(blob, defaultFilename) {
    if (isTauriEnvironment() && isTauriApiAvailable()) {
        try {
            return await saveBlobFileTauri(blob, defaultFilename);
        } catch (error) {
            console.error('Tauri 保存 Blob 失败，降级到浏览器:', error);
            return saveBlobFileBrowser(blob, defaultFilename);
        }
    } else {
        return saveBlobFileBrowser(blob, defaultFilename);
    }
}

// ========== Tauri 环境实现 ==========

async function saveTextFileTauri(content, defaultFilename) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    
    const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: '文本文件', extensions: ['txt'] }]
    });
    
    if (filePath) {
        await writeTextFile(filePath, content);
        console.log('✅ 文本文件已保存:', filePath);
        return true;
    }
    return false;
}

// 修复版：Tauri 图片保存
async function saveImageFileTauri(imageDataUrl, defaultFilename) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    
    // 方法1：从 dataURL 直接转换
    // 移除 data:image/png;base64, 前缀
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    
    // 将 base64 转换为 Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: 'PNG图片', extensions: ['png'] }]
    });
    
    if (filePath) {
        // 使用 writeFile 而不是 writeBinaryFile
        await writeFile(filePath, bytes);
        console.log('✅ 图片已保存:', filePath);
        return true;
    }
    return false;
}

async function saveBlobFileTauri(blob, defaultFilename) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    
    const ext = defaultFilename.split('.').pop() || 'bin';
    const filePath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: '文件', extensions: [ext] }]
    });
    
    if (filePath) {
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await writeFile(filePath, uint8Array);
        console.log('✅ 文件已保存:', filePath);
        return true;
    }
    return false;
}

// ========== 浏览器环境实现 ==========

function saveTextFileBrowser(content, defaultFilename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    return saveBlobFileBrowser(blob, defaultFilename);
}

function saveImageFileBrowser(imageDataUrl, defaultFilename) {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('✅ 浏览器下载图片:', defaultFilename);
    return true;
}

function saveBlobFileBrowser(blob, defaultFilename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('✅ 浏览器下载文件:', defaultFilename);
    return true;
}