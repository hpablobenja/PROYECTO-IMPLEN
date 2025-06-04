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
                dir('Backend') {
                    echo 'Instalando dependencias del backend (Node.js)...'
                    bat 'npm install'
                }
            }
        }

        stage('Backend: Run Unit Tests') {
            steps {
                dir('Backend') {
                    echo 'Ejecutando pruebas unitarias del backend...'
                    bat 'npm test'
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
                dir('Frontend') {
                    echo 'Instalando dependencias del frontend (React.js)...'
                    bat 'npm install'
                }
            }
        }

        stage('Frontend: Run Unit Tests') {
            steps {
                dir('Frontend') {
                    echo 'Ejecutando pruebas unitarias del frontend...'
                    bat 'npm test'
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
                dir('Frontend') {
                    echo 'Construyendo el frontend para producción (npm run build)...'
                    bat 'npm run build' // Esto generará la carpeta 'build' dentro de 'Frontend'
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                script {
                    echo 'Empaquetando artefactos para despliegue...'
                    // Empaquetar el backend (Node.js)
                    bat "tar -czvf sisconfig-backend.tar.gz -C Backend ."
                    // Empaquetar el frontend (los archivos de la carpeta 'build' generada por React)
                    bat "tar -czvf sisconfig-frontend.tar.gz -C Frontend\\build ."
                }
            }
        }

        stage('Deploy to QA') {
            steps {
                script {
                    echo 'Desplegando SISCONFIG a QA (Local)...'

                    // === Despliegue del Backend (Node.js) ===
                    echo "Preparando despliegue del backend en QA local..."
                    bat "if exist \"${env.NODE_APP_DIR}\" rmdir /s /q \"${env.NODE_APP_DIR}\""
                    bat "mkdir \"${env.NODE_APP_DIR}\""
                    bat "tar -xzvf sisconfig-backend.tar.gz -C \"${env.NODE_APP_DIR}\""
                    bat "del sisconfig-backend.tar.gz"
                    bat "pushd \"${env.NODE_APP_DIR}\" && npm install --production && popd"
                    
                    // Detener PM2 y esperar un momento para asegurar que el proceso se libere
                    echo "Deteniendo PM2 y esperando un momento..."
                    bat "pm2 stop sisconfig-backend || true" // '|| true' evita que falle si no está corriendo
                    bat "timeout /t 5 /nobreak" // Espera 5 segundos para que el proceso se termine
                    
                    echo "Iniciando/Reiniciando el backend con PM2..."
                    bat "cd /D \"${env.NODE_APP_DIR}\" && pm2 start app.js --name sisconfig-backend || pm2 restart sisconfig-backend"


                    // === Despliegue del Frontend (React.js en Tomcat local) ===
                    echo "Preparando despliegue del frontend en Tomcat en QA local..."
                    bat "if exist \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\" rmdir /s /q \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""
                    bat "mkdir \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""
                    bat "tar -xzvf sisconfig-frontend.tar.gz -C \"${env.TOMCAT_WEBAPPS_PATH}\\${env.FRONTEND_APP_NAME}\""
                    bat "del sisconfig-frontend.tar.gz"

                    echo "¡ATENCIÓN! Reinicio de Tomcat manual o con permisos de administrador. Verifica que tu Tomcat se recargue al detectar cambios en webapps o reinícialo manualmente para probar."
                }
            }
        }

        stage('Run E2E Tests (Optional but Recommended)') {
            steps {
                script {
                    echo 'Ejecutando pruebas E2E en QA local (simulado)...'
                    // Aquí irían tus comandos para ejecutar las pruebas E2E, e.g.:
                    // bat 'npm test --prefix Frontend/e2e'
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
                expression { false } // Cambia a 'true' si quieres habilitar la aprobación manual
            }
            steps {
                input message: '¿Aprobar el despliegue a Producción?', submitter: 'admin, devops'
            }
        }
    }

    post {
        always {
            echo 'Pipeline completado.'
            // Aplicando las sugerencias para cleanWs()
            // deleteDirs: true -> Asegura que los directorios también se borren.
            // disableDeferredWipeout: true -> Fuerza la eliminación inmediata.
            // notFailBuild: true -> (Temporalmente) Permite que el pipeline no falle si la limpieza falla.
            //                       Idealmente, una vez resuelto el problema de bloqueo, se debería quitar.
            cleanWs(deleteDirs: true, disableDeferredWipeout: true, notFailBuild: true)
        }
        success {
            echo '¡El pipeline se ejecutó con éxito!'
        }
        failure {
            echo '¡El pipeline falló!'
            // Puedes añadir acciones adicionales aquí en caso de fallo, como notificaciones
        }
    }
}
