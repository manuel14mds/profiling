import express from 'express'
import cluster from 'cluster'
import * as fs from 'fs'
import { cpus } from 'os'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = parseInt(process.argv[2]) || 8080
const modoCluster = process.argv[3] == 'cluster'

/* 
node ./src/app.js 8080 FORK
node ./src/app.js 8080 CLUSTER

artillery quick --count 50 -n 20 'http://localhost:8080/'
artillery quick --count 50 -n 20 'http://localhost:8080/'

node --prof-process profiling.log > resultadoProfiling.txt

artillery quick --count 50 -n 20 'http://localhost:8080/' > resultFork.txt
artillery quick --count 50 -n 20 'http://localhost:8080/' > resultCluster.txt
*/


if (modoCluster && cluster.isPrimary) {
    const numCPUs = cpus().length

    console.log(`Número de procesadores: ${numCPUs}`)
    console.log(`PID MASTER ${process.pid}`)

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', worker => {
        console.log('Worker', worker.process.pid, 'died', new Date().toLocaleString())
        cluster.fork()
    })
} else {
    const app = express()

    app.get('/info', async(req, res) => {
        let result = await info()
        console.log(result)
        res.json(result)
    })

    app.listen(PORT, () => {
        console.log(`Servidor express escuchando en el puerto ${PORT}`)
        console.log(`PID WORKER ${process.pid}`)
    })
}

async function info() {
    if (fs.existsSync(__dirname+'/file.json')) {
        let fileData = await fs.promises.readFile(__dirname+'/file.json', 'utf-8')
        let info = JSON.parse(fileData)
        return info
    } else {
        return []
    }
}