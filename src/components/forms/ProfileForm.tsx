"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { updateProfileSchema, type UpdateProfileInput } from "@/modules/auth/domain/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/index";
import { toast } from "@/components/ui/toaster";
import { ImageUploadField } from "@/components/forms/ImageUploadField";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
  };
}

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const router = useRouter();
  const { update: updateSession } = useSession();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const avatarField = register("avatarUrl");

  const onSubmit = async (data: UpdateProfileInput) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (!result.success) {
          toast({
            type: "error",
            title: "Алдаа",
            description: result.error,
          });
          return;
        }

        toast({ type: "success", title: "Профайл хадгалагдлаа" });
        // Sync session image with new avatarUrl so header updates immediately
        await updateSession();
        router.refresh();
      } catch {
        toast({ type: "error", title: "Сүлжээний алдаа" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...avatarField} />

      <div className="flex items-center gap-4">
        <ImageUploadField
          value={avatarPreview}
          category="AVATAR"
          folder="avatars"
          shape="circle"
          label=""
          helper=""
          onChange={(url) => {
            setAvatarPreview(url);
            setValue("avatarUrl", url, { shouldDirty: true, shouldValidate: true });
          }}
          onClear={() => {
            setAvatarPreview(null);
            setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: true });
          }}
        />

        <div>
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            JPG, PNG, WEBP зураг upload хийж болно.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Нэр</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-xs text-red-500">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label>Имэйл хаяг</Label>
        <Input value={user.email} disabled className="bg-muted/50" />
        <p className="text-xs text-muted-foreground/80">Имэйл хаяг солих боломжгүй</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Танилцуулга</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Өөрийн тухай товч мэдээлэл..."
          {...register("bio")}
        />
        <p className="text-xs text-muted-foreground/80">Хамгийн ихдээ 500 тэмдэгт</p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" /> Хадгалж байна...
            </>
          ) : (
            "Өөрчлөлт хадгалах"
          )}
        </Button>
      </div>
    </form>
  );
}
