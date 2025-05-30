"use client";
import getHeaders from "@/app/utils/headers.util";
import { Button } from "@/components/ui/button";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import {
  arrowcon,
  chat,
  cloud,
  cross,
  logo60,
  logoWithText,
  sendBlue,
  setting,
} from "@/public";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
import { db } from "@/configs/Firebase-config";
import axios from "axios";
import { toast } from "sonner";

const Onboarding = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const name = searchParams.get("name");
  const plan = searchParams.get("plan");
  const prompt = searchParams.get("prompt");
  const agent_id = searchParams.get("agent_id");
  const [formData, setFormData] = useState({
    email: email || "",
    name: name || "",
    source: "",
    industry: "",
    jobTitle: "",
    companyName: "",
  });

  const uid = searchParams.get("uid");

  const router = useRouter();

  // Add state to track authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Check if the user is authenticated and email matches
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Import auth only on client side
        const { getAuth, onAuthStateChanged } = await import("firebase/auth");
        const auth = getAuth();

        onAuthStateChanged(auth, (user) => {
          if (user) {
            // User is signed in
            if (user.email === email) {
              setIsAuthenticated(true);
              setAuthError("");
            } else {
              setIsAuthenticated(false);
              setAuthError(
                "Email mismatch. Please sign in with the correct account."
              );
            }
          } else {
            // User is not signed in
            setIsAuthenticated(false);
            setAuthError("You must be signed in to access this page.");
          }
        });
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Authentication error. Please try again.");
      }
    };

    checkAuth();
  }, [email, router]);

  const handleCheckoutRedirect = async (uid: string) => {
    try {
      const subUrl = process.env.NEXT_PUBLIC_SUBSCRIPTION_BASE_URL;
      const response = await axios.get(
        `${subUrl}/create-checkout-session?user_id=${uid}&plan_type=${plan}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error getting checkout URL:", error);
    }
  };

  const submitOnboarding = async () => {
    try {
      if (!isAuthenticated) {
        throw new Error(
          authError || "Authentication required. Please sign in."
        );
      }

      if (!uid) {
        throw new Error("User ID is missing");
      }

      // Validate required fields
      if (
        !formData.name ||
        !formData.source ||
        !formData.industry ||
        !formData.jobTitle ||
        !formData.companyName
      ) {
        throw new Error("Please fill out all required fields.");
      }

      const userDoc = {
        uid,
        ...formData,
        signedUpAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, "users", uid), userDoc);
      } catch (firebaseError: any) {
        console.error("Firebase Error:", firebaseError);
        if (firebaseError.code === "permission-denied") {
          throw new Error(
            "Unable to save user data. Please try signing out and signing in again."
          );
        }
        throw new Error(
          "Error saving user data to database. Please try again."
        );
      }

      if (agent_id) {
        // If agent_id parameter exists, redirect to shared agent page
        router.push(`/shared-agent?agent_id=${agent_id}`);
      } else if (plan) {
        // If plan parameter exists, redirect to stripe checkout
        await handleCheckoutRedirect(uid);
      } else if (prompt) {
        // If prompt parameter exists, redirect to all-agents with create modal
        router.push(
          `/all-agents?createAgent=true&prompt=${encodeURIComponent(prompt)}`
        );
      } else {
        // Otherwise continue to normal flow
        router.push("/link-github");
      }
    } catch (error: any) {
      console.error("Error saving onboarding data:", error);
      toast.error(
        error.message || "Error saving onboarding data. Please try again."
      );
    }
  };

  return (
    <section className="lg:flex-row flex-col-reverse flex items-center justify-between w-full lg:h-screen relative">
      <div className="flex items-center justify-center w-1/2 h-full p-6">
        <div className="relative h-full w-full rounded-lg overflow-hidden">
          <Image
            src={"/images/landing.png"}
            alt="landing"
            layout="fill"
            objectFit="cover"
          />
        </div>
      </div>
      <div className="w-1/2 h-full flex items-center justify-center flex-col gap-14">
        <div className="flex items-center justify-center flex-row gap-2">
          <Image
            src={"/images/potpie-blue.svg"}
            width={100}
            height={100}
            alt="logo"
          />
          <h1 className="text-7xl font-bold text-gray-700">potpie</h1>
        </div>
        <div className="flex items-center justify-center flex-col text-border">
          <h3 className="text-2xl font-bold text-black">
            Lets get a few more info and you are good to go!
          </h3>

          {/* Add authentication error message */}
          {authError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {authError}
            </div>
          )}

          {/* Only show the form if authenticated */}
          {isAuthenticated ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitOnboarding();
              }}
              className="flex flex-col gap-6 mt-10"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  value={email || ""}
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  How did you find us?
                </label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select an option</option>
                  <option value="Reddit">Reddit</option>
                  <option value="Twitter">Twitter</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="HackerNews">HackerNews</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  Industry you work in?
                </label>
                <input
                  type="text"
                  placeholder="Enter your industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  Your job title?
                </label>
                <input
                  type="text"
                  placeholder="Enter your job title"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">
                  Your company name?
                </label>
                <input
                  type="text"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-80 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </form>
          ) : (
            <div className="mt-10 p-6 bg-gray-100 rounded-md text-black text-center">
              <p>Please sign in to continue.</p>
              <Button
                onClick={() => router.push("/sign-in")}
                className="mt-4 mx-auto hover:bg-black bg-gray-800"
              >
                Go to Sign In
              </Button>
            </div>
          )}

          {isAuthenticated && (
            <Button
              onClick={() => submitOnboarding()}
              className="mt-14 gap-2 hover:bg-black bg-gray-800"
              disabled={!isAuthenticated}
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Onboarding;
