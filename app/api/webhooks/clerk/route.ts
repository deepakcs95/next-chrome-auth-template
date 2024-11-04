import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, deleteUser, updateUser } from "@/lib/db/users";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle webhook events
  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  // console.log("Webhook body:", body);

  if (evt.type === "user.created") {
    try {
      const email = evt.data.email_addresses[0]?.email_address;
      if (!email) {
        console.error("No email address found for user:", evt.data.id);
        return new Response("Invalid user data", { status: 400 });
      }

      await createUser(email, evt.data.id, evt.data.first_name || "Anonymous");

      console.log("User successfully created:", evt.data.id);
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (evt.type === "user.updated") {
    try {
      const email = evt.data.email_addresses[0]?.email_address;
      if (!email) {
        console.error("No email address found for user:", evt.data.id);
        return new Response("Invalid user data", { status: 400 });
      }

      await updateUser(evt.data.id, {
        email,
        name: evt.data.first_name || "Anonymous",
      });

      console.log("User successfully updated:", evt.data.id);
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (evt.type === "user.deleted") {
    try {
      if (!evt.data.id) {
        console.error("No user ID found for deleted user");
        return new Response("Invalid user data", { status: 400 });
      }
      await deleteUser(evt.data.id);

      console.log("User successfully deleted:", evt.data.id);
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
