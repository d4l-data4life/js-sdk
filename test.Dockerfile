
FROM selenium/standalone-chrome
# User must be set to root if you want to install something inside the selenium image
USER root

# Install node and npm
RUN apt-get update && apt-get install -y gnupg2 git &&\
    curl -sL https://deb.nodesource.com/setup_10.x | bash - &&\
    apt-get install -y nodejs &&\
    npm install -g npm@latest

RUN curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Make git to pull the dependency with the provided github token rather than with ssh
ARG GITHUB_TOKEN
RUN git config --global url."https://${GITHUB_TOKEN}:x-oauth-basic@github.com/".insteadOf "ssh://git@github.com/"

WORKDIR /sdk
COPY . .

RUN sudo chown -R nobody ~/.npm ~/.config /sdk /home/seluser

USER nobody

RUN node -v && npm -v

# Set required environment variables
ENV NODE_ENV dev
# Install dependencies and our test framework
RUN npm update && \
	npm install
