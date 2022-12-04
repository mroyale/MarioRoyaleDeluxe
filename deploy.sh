echo [-- Shutdown Tomcat Server --]
cd bin
sh shutdown.sh
cd ../

echo [-- Build WAR --]
mvn clean install

echo [-- Copy WAR --]
rm /var/lib/tomcat9/webapps/royale.war
cp royale-client/target/client-1.0.war /var/lib/tomcat9/webapps/royale.war

echo [-- Start Tomcat Server --]
cd bin
sh startup.sh
cd ../