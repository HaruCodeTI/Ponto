import React from "react";
import PublicLayout from '../layout';

export default function AuthPublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
} 