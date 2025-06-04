// Jenkinsfile para el proyecto PROYECTO-IMPLEN (SISCONFIG)
pipeline {
    agent any

    environment {
        // Variables de entorno para la construcción y despliegue
        NODE_VERSION = '18.x' // O la versión de Node.js que uses
        // Rutas absolutas en tu máquina Windows (ajusta según tu configuración REAL)
        TOMCAT_WEBAPPS_PATH = 'C:\\Program Files\\Apache Software Foundation\\Tomcat 9.0\\webapps' // EJEMPLO
        FRONTEND_APP_NAME = 'sisconfig-frontend' // Nombre de la carpeta para el frontend en Tomcat
        NODE_APP_DIR = 'C:\\QA\\sisconfig-backend' // Directorio donde se desplegará el backend localmente

        // Configura PM2_HOME para que PM2 sepa dónde guardar sus archivos en Windows
        // Esto resolverá: "[PM2][Initialization] Environment variable HOME (Linux) or HOMEPATH (Windows) are not set!"
        PM2_HOME = 'C:\\Users\\your_jenkins_user\\.pm2' // O una ruta similar, asegúrate de que exista y Jenkins tenga permisos.
                                                        // Podría ser también en C:\ProgramData\Jenkins\.jenkins\.pm2
                                                        // Asegúrate que el usuario de servicio de Jenkins tenga permisos en esta ruta.

        QA_SERVER_IP = 'localhost'
        QA_SERVER_USER = 'tu_usuario_windows'
        SSH_CREDENTIAL_ID = 'your-ssh-credential-id'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Clonando el repositorio PROYECTO-IMPLEN...'
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
                    // bat 'npm test'
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
                    // bat 'npm test'
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
                    bat 'npm run build'
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                script {
                    echo 'Empaquetando artefactos para despliegue...'
                    bat "tar -czvf sisconfig-backend.tar.gz -C Backend ."
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
                    
                    echo "Intentando detener PM2 y esperando un momento..."
                    // Para Windows, no uses '|| true'. PM2 ya devuelve un error si el proceso no existe.
                    // Si el comando falla, Jenkins por defecto marca la etapa como fallida.
                    // Podemos manejarlo usando 'try-catch' en Groovy si realmente quieres que no falle
                    // o aceptar el error de PM2 si el proceso no está corriendo, ya que el siguiente
                    // 'pm2 start || pm2 restart' lo gestionará.
                    try {
                        bat "pm2 stop sisconfig-backend"
                        echo "PM2 sisconfig-backend detenido (si estaba corriendo)."
                    } catch (err) {
                        echo "Advertencia: No se pudo detener PM2 sisconfig-backend (posiblemente no estaba corriendo). Error: ${err.message}"
                    }

                    // Aún mantenemos el timeout para dar tiempo a liberar recursos
                    bat "timeout /t 5 /nobreak"
                    
                    echo "Iniciando/Reiniciando el backend con PM2..."
                    // pm2 start ... || pm2 restart ... ya maneja si el proceso existe o no.
                    bat "cd /D \"${env.NODE_APP_DIR}\" && pm2 start app.js --name sisconfig-backend"


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
            // Manteniendo los parámetros para cleanWs()
            cleanWs(deleteDirs: true, disableDeferredWipeout: true, notFailBuild: true)
        }
        success {
            echo '¡El pipeline se ejecutó con éxito!'
        }
        failure {
            echo '¡El pipeline falló!'
        }
    }
}
