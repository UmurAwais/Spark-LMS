# MongoDB Setup Guide

To make your data permanent on the live site, you need to connect your app to a MongoDB database.

## 1. Get a MongoDB Connection String

1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up for a free account.
2.  Create a new **Cluster** (the free tier is fine).
3.  Click **Connect** on your cluster.
4.  Choose **Drivers** (Node.js).
5.  Copy the **Connection String**. It looks like this:
    `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
6.  Replace `<username>` and `<password>` with your actual database user credentials (not your login password).

## 2. Set up Environment Variables

### For Local Development
1.  Create a file named `.env` in the `server` folder.
2.  Add the following line:
    ```
    MONGODB_URI=your_connection_string_here
    ```

### For Vercel (Live Site)
1.  Go to your project settings on Vercel.
2.  Go to **Environment Variables**.
3.  Add a new variable:
    *   **Key:** `MONGODB_URI`
    *   **Value:** (Paste your connection string)
4.  Redeploy your project.

## 3. Verify
Once connected, your orders and courses will be saved to MongoDB instead of local files. This means they will persist even after new deployments!
