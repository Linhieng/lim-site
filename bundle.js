const fs = require('fs')
const path = require('path')

/**
 * 默认是合法路径
 *
 * @param {string} parent
 * @param {string} child
 * @returns
 */
function concatPath(parent, child) {
    parent = path.resolve(path.normalize(parent))
    if (child.startsWith('/') || child.startsWith('\\')) {
        child = child.slice(1)
    }

    if (path.isAbsolute(child)) {
        console.warn(`警告：文件中使用了未知的绝对路径 ${child}`)
        return child
    }

    return path.join(parent, child)
}

function extractExternalFiles(htmlContent, regex) {
    const externalFiles = []
    let match
    while ((match = regex.exec(htmlContent)) !== null) {
        externalFiles.push(match[1])
    }
    return externalFiles
}

/**
 * 解析 html 文件中的 link 和 script 标签中的链接
 * @param {*} htmlFile
 * @returns
 */
function parseHTML(htmlFile) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf-8')

    // 解析 link 标签
    const linkRegex = /<link\s+.*?href=["']([^"']+)["'].*?>/g
    const externalLinks = extractExternalFiles(htmlContent, linkRegex)

    // 解析 script 标签
    const scriptRegex = /<script\s+.*?src=["']([^"']+)["'].*?>/g
    const externalScripts = extractExternalFiles(htmlContent, scriptRegex)

    return [
        ...externalLinks,
        ...externalScripts
    ]
}

function resolveToAbsolutionPath(parentDir, links) {
    // 将路径转换为硬盘中的绝对路径
    const absolutePaths = links.map(relativePath => {
        return concatPath(parentDir, relativePath)
    })

    return absolutePaths
}

/**
 * 输出文件内容到 destPath
 *
 * @param {string} fileData
 * @param {string} destPath
 */
function outputToDist(fileData, destPath) {
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true})
    }

    if (typeof fileData)

    fs.writeFileSync(destPath, fileData, 'utf8')
}
/**
 *
 * @param {string} src
 * @param {string} dest
 */
function copyToDist(src, dest) {
    const dir = path.dirname(dest)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true})
    }
    fs.copyFileSync(src, dest)
}

function main(entryHtml = 'src/index.html') {
    const externalFiles = parseHTML(entryHtml)
    console.log('外部文件引用:')
    externalFiles.forEach(file => console.log(file))

    // TODO: css 中的外部文件未检索
    externalFiles.push('assets/img/link.png')
    externalFiles.push('index.html')
    const realPath = resolveToAbsolutionPath('src', externalFiles)
    console.log('外部文件解析成实际路径:')
    realPath.forEach(file => console.log(file))

    const outputRealPath = resolveToAbsolutionPath('dist', externalFiles)
    console.log('输出文件的实际路径:')
    outputRealPath.forEach(file => console.log(file))

    // 将文件输出到 dist 目录中
    realPath.forEach((file, index) => {
        if (file.endsWith('.html')) {
            const fileData =  fs.readFileSync(file, 'utf8')
                .split(/\r?\n/)
                .map(str => str.trim())
                .join('')
            outputToDist(fileData, outputRealPath[index])
        } else {
            copyToDist(file, outputRealPath[index])
        }
        console.log(`output ${file} to ${outputRealPath[index]}`)
    })
}

try {
    main()
} catch (error) {
    console.log(error);
}
