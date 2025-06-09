FROM nginx:1.26.0-alpine

# Cài đặt các phụ thuộc cần thiết
RUN apk add --no-cache \
    libstdc++ \
    pcre \
    libxml2 \
    curl \
    geoip \
    yajl \
    lmdb \
    && apk add --no-cache --virtual .build-deps \
    build-base \
    autoconf \
    automake \
    curl-dev \
    geoip-dev \
    git \
    libxml2-dev \
    linux-headers \
    pcre-dev \
    yajl-dev \
    lmdb-dev \
    && git clone --depth 1 -b v3/master --single-branch https://github.com/SpiderLabs/ModSecurity /usr/src/modsecurity \
    && cd /usr/src/modsecurity \
    && ./build.sh \
    && git submodule init \
    && git submodule update \
    && ./configure \
    && make \
    && make install \
    && cd .. \
    && rm -rf modsecurity \
    && git clone --depth 1 -b v1.0.3 --single-branch https://github.com/SpiderLabs/ModSecurity-nginx /usr/src/modsecurity-nginx \
    && curl -SL https://nginx.org/download/nginx-1.26.0.tar.gz | tar -xz \
    && cd nginx-1.26.0 \
    && ./configure --with-compat --add-dynamic-module=/usr/src/modsecurity-nginx \
    && make modules \
    && cp objs/ngx_http_modsecurity_module.so /usr/lib/nginx/modules/ \
    && cd .. \
    && rm -rf nginx-1.26.0 modsecurity-nginx \
    && apk del .build-deps

# Sao chép OWASP CRS
RUN mkdir -p /etc/nginx/owasp-crs \
    && curl -SL https://github.com/coreruleset/coreruleset/archive/v4.14.0.tar.gz | tar -xz -C /etc/nginx/owasp-crs --strip-components=1

# Load ModSecurity module
RUN echo "load_module /usr/lib/nginx/modules/ngx_http_modsecurity_module.so;" > /etc/nginx/modules-enabled/modsecurity.conf