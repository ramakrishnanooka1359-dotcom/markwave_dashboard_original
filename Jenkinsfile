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
          sudo rm -rf /var/www/markwave/*
          sudo cp -r public/* /var/www/markwave/
          sudo chown -R www-data:www-data /var/www/markwave
          sudo chmod -R 755 /var/www/markwave
        '''
    }
}

            }
        }
    }
}
