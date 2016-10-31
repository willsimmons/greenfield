#!/bin/sh

# Another possibility would be to use https://github.com/DylanPiercey/auto-sni

# This will install the certificates in: /etc/letsencrypt/live/radradio.stream/
cd /root/radradio.stream
wget https://dl.eff.org/certbot-auto  
chmod a+x certbot-auto
./certbot-auto certonly --standalone -d radradio.stream

# update kurento media server certificate
cat /etc/letsencrypt/live/radradio.stream/privkey.pem /etc/letsencrypt/live/radradio.stream/fullchain.pem > /etc/kurento/defaultCertificate.pem
chown kurento /etc/kurento/defaultCertificate.pem
chgrp kurento /etc/kurento/defaultCertificate.pem
service kurento-media-server restart
