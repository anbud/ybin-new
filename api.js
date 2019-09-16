/*
 *  ybin 0.0.7
 *
 *  Copyright (C) 2019 - Andrej Budinčević <andrew@hotmail.rs>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

const apiRouter = require('express').Router()
const _ = require('lodash')
const fs = require('fs').promises
const crypto = require('crypto')

const validSJCL = obj => {
    let acceptedKeys = ['iv','v','iter','ks','ts','mode','adata','cipher','salt','ct']

    if (acceptedKeys.some(key => obj[key] === undefined)) {
        return false
    }

    if (!Buffer.from(obj.iv, 'base64').toString()) {
        return false
    }
    if (!Buffer.from(obj.salt, 'base64').toString()) {
        return false
    }
    if (!Buffer.from(obj.cipher, 'base64').toString()) {
        return false
    }

    if (_.intersection(Object.keys(obj), acceptedKeys).length !== 10) { 
        return false
    }

    if (obj.iv.length > 24 || obj.salt.length > 65) { 
        return false
    }

    return true
}

apiRouter.get('/paste/:id', async (req, res) => {
    if (!req.params.id || !/^[a-f\d]{16}$/.test(req.params.id)) {
        return res.status(400).send({
            error: 'Invalid request.'
        })
    }

    let filename = `${__dirname}/data/${req.params.id.substr(0, 2)}/${req.params.id.substr(2, 2)}/${req.params.id}`

    try {
        let file = await fs.readFile(filename)

        return res.status(200).send(file.toString('utf-8'))
    } catch (e) {
        return res.status(404).send({
            error: 'Paste not found.'
        })
    }
})

apiRouter.post('/save', async (req, res) => {
    if (!req.body.data) {
        return res.status(400).send({
            error: 'Data can\'t be empty!'
        })
    }

    let str = JSON.stringify(req.body.data)

    try {
        if (str > 20000000) { 
            return res.status(400).send({
                error: 'Paste is too big! File size limit for encrypted data is 20MB.'
            })
        }

        if (!validSJCL(req.body.data)) { 
            return res.status(400).send({
                error: 'Invalid data.'
            })
        }

        let dataId = crypto.createHash('md5').update(str).digest('hex').substr(0, 16)

        let dir = `${__dirname}/data/${dataId.substr(0, 2)}/${dataId.substr(2, 2)}/`

        await fs.mkdir(dir, {
            recursive: true
        })

        await fs.writeFile(`${dir}${dataId}`, JSON.stringify({
            data: str
        }))

        return res.status(200).send({
            id: dataId
        })
    } catch (e) {
        return res.status(500).send({
            error: 'Internal server error.'
        })
    }
})

module.exports = apiRouter
