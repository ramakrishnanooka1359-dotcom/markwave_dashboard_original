pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds',
                    url: 'https://github.com/ramakrishnanooka1359-dotcom/markwave_dashboard_original.git'
            }
        }

        stage('Deploy to Nginx') {
            steps {
                sh '''
                  rm -rf /var/www/markwave/*
                  cp -r * /var/www/markwave/
                '''
            }
        }
    }
}
