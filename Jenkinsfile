pipeline {
    agent any

    tools {
        nodejs 'nodejs'   // Jenkins NodeJS tool name
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/ramakrishnanooka1359-dotcom/markwave_dashboard_original.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    npm run build
                '''
            }
        }

        stage('Deploy to Nginx') {
            steps {
                sh '''
                    sudo rm -rf /var/www/markwave/*
                    sudo cp -r dist/* /var/www/markwave/
                    sudo chown -R www-data:www-data /var/www/markwave
                    sudo chmod -R 755 /var/www/markwave
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Build & Deployment Successful"
        }
        failure {
            echo "❌ Build or Deployment Failed"
        }
    }
}

