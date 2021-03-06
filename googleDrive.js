function initClient() {
    gapi.client.init({
        // Ваш ключ API
        apiKey: 'AIzaSyCntahLWhxAM2L2OnPUacVzojRyMjIAK1I',

        // Ваш идентификатор клиента
        clientId: '126471463465-16ouhhdb50af1sqajoffmse2t3dneb5o.apps.googleusercontent.com',

        // Указание, что мы хотим использовать Google Drive API v3
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],

        // Запрос доступа к application data folder (см. ниже)
        scope: 'https://www.googleapis.com/auth/drive.appfolder'

    }).then(() => {
        // Начинаем ловить события логина/логаута (см. ниже)
        gapi.auth2.getAuthInstance().isSignedIn.listen(onSignIn)
        // инициализация приложения
        /* initApp() */
        console.log('инициализирую приложение')

    }, error => {
        console.log('Failed to init GAPI client', error)
        // работаем без гугла
        initApp({ showAlert: 'google-init-failed-alert' })
    })
}


function isGapiLoaded() {
    return gapi && gapi.auth2
}

function logIn() {
    if (isGapiLoaded()) {
        // откроется стандартное окно Google с выбором аккаунта
        gapi.auth2.getAuthInstance().signIn()
    }
}

function logOut() {
    if (isGapiLoaded()) {
        gapi.auth2.getAuthInstance().signOut()
    }
}


function isLoggedIn() {
    return isGapiLoaded() && gapi.auth2.getAuthInstance().isSignedIn.get()
}

function onSignIn() {
    if (isLoggedIn()) {
        // пользователь зашел
        console.log('пользователь зашел');
    } else {
        // пользователь вышел
        console.log('пользователь вышел');
    }
    // пример реализации см. ниже в разделе "Синхронизация"
}


function prom(gapiCall, argObj) {
    return new Promise((resolve, reject) => {
        gapiCall(argObj).then(resp => {
            if (resp && (resp.status < 200 || resp.status > 299)) {
                console.log('GAPI call returned bad status', resp)
                reject(resp)
            } else {
                resolve(resp)
            }
        }, err => {
            console.log('GAPI call failed', err)
            reject(err)
        })
    })
}

async function createEmptyFile(name, mimeType) {
    const resp = await prom(gapi.client.drive.files.create, {
        resource: {
            name: name,
            // для создания папки используйте
            // mimeType = 'application/vnd.google-apps.folder'
            mimeType: mimeType || 'text/plain',
            // вместо 'appDataFolder' можно использовать ID папки
            parents: ['appDataFolder']
        },
        fields: 'id'
    })
    // функция возвращает строку — идентификатор нового файла
    return resp.result.id
}


async function upload(fileId, content) {
    // функция принимает либо строку, либо объект, который можно сериализовать в JSON
    return prom(gapi.client.request, {
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: {uploadType: 'media'},
        body: typeof content === 'string' ? content : JSON.stringify(content)
    })
}

async function download(fileId) {
    const resp = await prom(gapi.client.drive.files.get, {
        fileId: fileId,
        alt: 'media'
    })
    // resp.body хранит ответ в виде строки
    // resp.result — это попытка интерпретировать resp.body как JSON.
    // Если она провалилась, значение resp.result будет false
    // Т.о. функция возвращает либо объект, либо строку
    return resp.result || resp.body
}

async function find(query) {
    let ret = []
    let token
    do {
        const resp = await prom(gapi.client.drive.files.list, {
            // вместо 'appDataFolder' можно использовать ID папки
            spaces: 'appDataFolder',
            fields: 'files(id, name), nextPageToken',
            pageSize: 100,
            pageToken: token,
            orderBy: 'createdTime',
            q: query
        })
        ret = ret.concat(resp.result.files)
        token = resp.result.nextPageToken
    } while (token)
    // результат: массив объектов вида [{id: '...', name: '...'}],
    // отсортированных по времени создания
    return ret
}

async function deleteFile(fileId) {
    try {
        await prom(gapi.client.drive.files.delete, {
            fileId: fileId
        })
        return true
    } catch (err) {
        if (err.status === 404) {
            return false
        }
        throw err
    }
}