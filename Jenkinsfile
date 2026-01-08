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

        stage('Build') {
            steps {
                echo "Build step running..."
            }
        }

        stage('Test') {
            steps {
                echo "Test step running..."
            }
        }
    }
}
