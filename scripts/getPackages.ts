import { readdirSync } from 'fs'
import path from 'path'

const _packages = readdirSync(path.join(__dirname, '..', 'packages'))
