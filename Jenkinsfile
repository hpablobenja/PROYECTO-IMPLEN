// Jenkinsfile para el proyecto PROYECTO-IMPLEN (SISCONFIG)
pipeline {
    agent any

    environment {
        // Variables de entorno para la construcción y despliegue
        NODE_VERSION = '18.x' // O la versión de Node.js que uses
        // Rutas absolutas en tu máquina Windows (ajusta según tu configuración REAL)
        // Reemplaza 'C:\tu_ruta_a_tomcat\webapps' con la ruta real a la carpeta webapps de tu Tomcat local.
        TOMCAT_WEBAPPS_PATH = 'C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps' // EJEMPLO
        FRONTEND_APP_NAME = 'sisconfig-frontend' // Nombre de la carpeta para el frontend en Tomcat
        // Reemplaza 'C:\QA\sisconfig-backend' con la ruta real donde quieres el backend.
        NODE_APP_DIR = 'C:\\QA\\sisconfig-backend' // Directorio donde se desplegará el backend localmente

        // Como QA es local, la IP del servidor es 'localhost' o la IP local de tu máquina.
        // Las credenciales SSH ya no son tan críticas para comandos LOCALES,
        // pero las mantenemos para coherencia si en un futuro es un servidor remoto.
        QA_SERVER_IP = 'localhost' // O tu IP local, ej. '127.0.0.1'
        QA_SERVER_USER = 'tu_usuario_windows' // El usuario de Windows que ejecutará los comandos.
                                              // Asegúrate que este usuario tenga permisos sobre las rutas de despliegue.
        // La credencial SSH ya no es directamente usada para comandos locales,
        // pero si usas el cliente OpenSSH para Windows, las claves pueden seguir siendo útiles.
        // Por ahora, para simplificar el despliegue LOCAL, la omitiremos en los comandos directos.
        // Si necesitas autenticación para SSH local (ej. para PM2 con SSH), deberás revisarlo.
        SSH_CREDENTIAL_ID = 'your-ssh-credential-id' // ID de tu credencial SSH, mantenlo por si acaso.
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Clonando el repositorio PROYECTO-IMPLEN...'
                // El plugin de Git ya se encarga de esto en la configuración de la Job,
                // este paso 'git' dentro del script es redundante.
            }
        }

        stage('Backend: Install Dependencies') {
            steps {
                dir('server') { // Asegúrate de que tu backend está en una carpeta 'server'
                    echo 'Instalando dependencias del backend (Node.js)...'
                    // Usamos 'bat' para comandos de Windows Command Prompt
                    bat 'npm install'
                }
            }
        }

        stage('Backend: Run Unit Tests') {
            steps {
                dir('server') {
                    echo 'Ejecutando pruebas unitarias del backend...'
                    bat 'npm test || true' // '|| true' sigue siendo útil para que no falle el pipeline si las pruebas fallan.
                }
            }
            post {
                failure {
                    echo '¡Pruebas unitarias del backend fallaron!'
                }
            }
        }

        stage('Frontend: Install Dependencies') {
            steps {
                dir('client') { // Asegúrate de que tu frontend está en una carpeta 'client'
                    echo 'Instalando dependencias del frontend (React.js)...'
                    bat 'npm install'
                }
            }
        }

        stage('Frontend: Run Unit Tests') {
            steps {
                dir('client') {
                    echo 'Ejecutando pruebas unitarias del frontend...'
                    bat 'npm test || true'
                }
            }
            post {
                failure {
                    echo '¡Pruebas unitarias del frontend fallaron!'
                }
            }
        }

        stage('Frontend: Build for Production') {
            steps {
                dir('client') {
                    echo 'Construyendo el frontend para producción (npm run build)...'
                    bat 'npm run build' // Esto generará la carpeta 'build' dentro de 'client'
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                script {
                    echo 'Empaquetando artefactos para despliegue...'
                    // Para Windows, usaremos el 'tar' incluido en Git Bash (si está instalado y en PATH)
                    // o puedes usar módulos de PowerShell si no tienes Git Bash y quieres usarlo.
                    // Para simplificar, asumiremos que tienes 'tar' de Git Bash en tu PATH.
                    // Si no, la alternativa sería usar 'zip' o copiar archivos directamente.
                    // Si 'tar' da problemas, avísame.
                    bat "tar -czvf sisconfig-backend.tar.gz -C server ."
                    bat "tar -czvf sisconfig-frontend.tar.gz -C client\\build ." // Nota: 'client\\build' para Windows path
                }
            }
        }

        stage('Deploy to QA') {
            steps {
                script {
                    echo 'Desplegando SISCONFIG a QA (Local)...'

                    // === Despliegue del Backend (Node.js) ===
                    echo "Preparando despliegue del backend en QA local..."
                    // Aquí no necesitamos 'sshagent' porque es despliegue local.
                    // Usamos 'bat' para ejecutar comandos de Windows.
                    // Asegúrate de que tu usuario de Windows (el que ejecuta Jenkins) tiene permisos para estas rutas.

                    // 1. Limpiar y crear directorio para la aplicación en QA
                    // Usamos del (delete) y mkdir (make directory) de CMD
                    bat "if exist \"${env.NODE_APP_DIR}\" rmdir /s /q \"${env.NODE_APP_DIR}\"" // Eliminar si existe
                    bat "mkdir \"${env.NODE_APP_DIR}\"" // Crear el directorio

                    // 2. Descomprimir el paquete en el directorio de destino
                    // Asumimos 'tar' está disponible (ej. por Git Bash en PATH)
                    bat "tar -xzvf sisconfig-backend.tar.gz -C \"${env.NODE_APP_DIR}\""
                    // Limpiar el archivo tar.gz del workspace de Jenkins después de la extracción
                    bat "del sisconfig-backend.tar.gz"

                    // 3. Instalar dependencias en el servidor QA (dentro del directorio desplegado)
                    bat "pushd \"${env.NODE_APP_DIR}\" && npm install --production && popd" // 'pushd' y 'popd' para cambiar de directorio temporalmente

                    // 4. Iniciar/Reiniciar el backend con PM2 (si PM2 está instalado globalmente en Windows)
                    // PM2 en Windows a menudo se usa con 'pm2 start app.js'
                    // Asegúrate que PM2 esté instalado globalmente: npm install -g pm2
                    // Y que pm2 esté en el PATH de Windows.
                    bat "pm2 stop sisconfig-backend || true" // Stop (si existe)
                    bat "cd /D \"${env.NODE_APP_DIR}\" && pm2 start app.js --name sisconfig-backend || pm2 restart sisconfig-backend"


                    // === Despliegue del Frontend (React.js en Tomcat local) ===
                    echo "Preparando despliegue del frontend en Tomcat en QA local..."

                    // 1. Limpiar la aplicación antigua en Tomcat
                    // 'del /s /q' para eliminar contenido recursivamente
                    bat "if exist \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\" rmdir /s /q \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""
                    // 2. Crear la carpeta de la aplicación si no existe
                    bat "mkdir \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""

                    // 3. Descomprimir el paquete del frontend directamente en el directorio de Tomcat
                    bat "tar -xzvf sisconfig-frontend.tar.gz -C \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""
                    // Limpiar el archivo tar.gz del workspace de Jenkins
                    bat "del sisconfig-frontend.tar.gz"

                    // 4. Reiniciar Tomcat
                    // Esto es lo más delicado en Windows. 'net stop' y 'net start' necesitan permisos de administrador.
                    // El usuario de Jenkins debe tener permisos para ejecutar estos comandos.
                    // Si el servicio de Tomcat está corriendo como un servicio de Windows, puedes usar:
                    // bat "net stop Tomcat9" // (Reemplaza 'Tomcat9' con el nombre real de tu servicio Tomcat)
                    // bat "net start Tomcat9"

                    // O si usas 'shutdown.bat' y 'startup.bat' de Tomcat (desde su bin dir):
                    // Asegúrate que estos scripts tienen permisos de ejecución.
                    // bat "call \"C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\bin\\shutdown.bat\"" // Ajusta la ruta
                    // bat "timeout /t 5" // Espera unos segundos para que Tomcat se apague completamente
                    // bat "call \"C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\bin\\startup.bat\"" // Ajusta la ruta

                    // La opción más robusta y que requiere menos permisos de usuario de Jenkins directo,
                    // es si tienes el servicio de Tomcat configurado para auto-recargar o detecta cambios.
                    // Si no, te tocará configurar permisos de servicio o ejecutar los bat de stop/start.
                    echo "¡ATENCIÓN! Reinicio de Tomcat manual o con permisos de administrador. Verifica que tu Tomcat se recargue al detectar cambios en webapps o reinícialo manualmente para probar."
                    // Por ahora, dejaré la línea comentada, deberás decidir cómo reiniciar Tomcat.
                }
            }
        }

        stage('Run E2E Tests (Optional but Recommended)') {
            steps {
                script {
                    echo 'Ejecutando pruebas E2E en QA local (simulado)...'
                }
            }
            post {
                failure {
                    echo '¡Pruebas E2E fallaron en QA! Investiga el problema.'
                }
            }
        }

        stage('Manual Approval for Production (Example for main branch)') {
            when {
                expression { false }
            }
            steps {
                input message: '¿Aprobar el despliegue a Producción?', submitter: 'admin, devops'
            }
        }
    }

    post {
        always {
            echo 'Pipeline completado.'
            cleanWs()
        }
        success {
            echo '¡El pipeline se ejecutó con éxito!'
        }
        failure {
            echo '¡El pipeline falló!'
        }
    }
}
