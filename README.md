# MarioRoyaleDeluxe
Welcome to the Mario Royale Deluxe source code repository! If you're looking to self-host the project or to contribute then please look right below!

## Self-host setup
Setting up self-hosting is fairly simple; You just need:
- A ubuntu system (other distros may work but this tutorial is for Ubuntu)
- Sudo access to your system
- An installation of Maven and JDK (you can install both with `sudo apt install default-jdk maven`)
- Tomcat 9 (which you install with `sudo apt install tomcat9`)
- Git (may come pre-installed with Ubuntu)

### Step 1: Cloning the repository
First you'll need to clone this repository, simply go into your home directory and type `git clone https://github.com/mroyale/MarioRoyaleDeluxe`


### Step 2: Deploying
Now `cd MarioRoyaleDeluxe` and type `sudo sh deploy.sh`. This will create the WAR (web application archive) file and copy it into the tomcat9 webapps folder. By default it is set to copy into `/var/lib/tomcat9/webapps`, if your installation has this differently you can change it accordingly.

### Step 3: Profit
Head over to http://localhost:8080/royale/ to see your hosted version of Mario Royale Deluxe in action. Please note that if you edit any files you **have** to deploy again to see the changes you just made.