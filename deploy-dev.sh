echo [-- Shutdown Tomcat Server --]
cd bin
sudo sh shutdown.sh
cd ../

echo [-- Build WAR --]
mvn clean install

echo [-- Copy WAR --]
rm /var/lib/tomcat9/webapps/dev.war
cp royale-client/target/client-1.0.war /var/lib/tomcat9/webapps/dev.war

echo [-- Start Tomcat Server --]
cd bin
sudo sh startup.sh
cd ../