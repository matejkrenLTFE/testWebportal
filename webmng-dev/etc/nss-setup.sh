#!/bin/sh

# mkdir -p /etc/nss/db/ 
# certutil -N -d /etc/nss/db/
 
echo "internal:12345678" > /etc/pki/nssdb/pin.txt

chown -R root:daemon /etc/pki/nssdb/ 
chmod 0640 /etc/pki/nssdb/*
 
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -subj '/CN=localhost'
# openssl pkcs12 -export -in cert.pem -inkey key.pem -out server.p12 -name Server-Cert -passout pass:foo
 
pk12util -i ./cert/server.p12 -d /etc/pki/nssdb -W foo

certutil -A -n "rootCA" -t "CT,," -d /etc/pki/nssdb -a -i ./cert/rootCA.pem
 
certutil -d /etc/pki/nssdb -L

# Copy client-cert Apache configs
cp webmng-client-cert.conf /etc/apache2/conf.d/webmng.conf
cp webmng-nss-client-cert.conf /etc/apache2/conf.d/webmng-nss.conf
 
apachectl restart
 
tail -f /var/apache2/logs/error_log