node-sample
===========

A sample node app to demonstrate how to use node in production with ansible.

To use:

* Edit the ansible inventory file at [ansible/production](ansible/production) to Fedora 20 servers that you can SSH into.
* Run `./provision` to provision the load balancer and application servers.
* Go to `/haproxy?stats` on your load balancer (my_username/my_password). Your app servers should be red and marked as down.
* Run `./deploy` to deploy your code. In the haproxy stats you should see them marked as green. Going to the root of the load balancer should show the node app.t
