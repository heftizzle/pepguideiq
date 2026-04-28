import { useContext, useState } from "react";
import { PEPTIDES } from "../../data/catalog.js";
import { ProfileCtx } from "../../context/ProfileContext.jsx";
import { API_WORKER_URL } from "../../lib/config.js";
import { formatHandleDisplay } from "../../lib/memberProfileHandle.js";
import { openPublicMemberProfile } from "../../lib/openPublicProfile.js";
import { formatTimeAgo } from "../../lib/formatTime.js";
import { TIERS, tierAccentCssVar } from "../../lib/tiers.js";
import LikeButton from "../Likes/LikeButton.jsx";
import LikersRow from "../Likes/LikersRow.jsx";
import LikersModal from "../Likes/LikersModal.jsx";
import CommentsSection from "../Comments/CommentsSection.jsx";
import { VialNotesShareToggle } from "../Vials/VialNotesShareToggle.jsx";
import { resolveMemberAvatarDisplayUrlFromKey } from "../../lib/memberAvatarUrl.js";

const AVATAR_BASE = `${String(API_WORKER_URL || "").replace(/\/$/, "")}/avatars`;

function networkTierEmoji(tier) {
  const t = typeof tier === "string" ? tier.trim().toLowerCase() : "entry";
  return (TIERS[t] ?? TIERS.entry).emoji;
}

/**
 * @param {string | null | undefined} userId
 * @param {string | null | undefined} r2Key
 */
function buildAvatarUrl(userId, r2Key) {
  const key = typeof r2Key === "string" ? r2Key.trim() : "";
  if (!key || key.includes("..")) return null;
  if (key.includes("/")) {
    const u = resolveMemberAvatarDisplayUrlFromKey(key);
    return u || null;
  }
  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid || !String(API_WORKER_URL || "").trim()) return null;
  return `${AVATAR_BASE}/${uid}/${key}`;
}

/**
 * Shared vial row from get_network_vial_feed JSON.
 * @param {{ row: Record<string, unknown>, onNotesChanged?: () => void }} props
 */
export default function VialShareCard({ row, onNotesChanged }) {
  const postId = typeof row.post_id === "string" ? row.post_id : "";
  const handle = typeof row.handle === "string" ? row.handle.trim() : "";
  const displayName = typeof row.display_name === "string" ? row.display_name.trim() : "—";
  const tier = typeof row.tier === "string" ? row.tier : "entry";
  const score =
    typeof row.pepguideiq_score === "number" ? row.pepguideiq_score : Number(row.pepguideiq_score) || 0;
  const updatedAt = typeof row.updated_at === "string" ? row.updated_at : "";
  const ownerUserId = typeof row.user_id === "string" ? row.user_id.trim() : "";
  const avatarKey = typeof row.avatar_r2_key === "string" ? row.avatar_r2_key.trim() : "";
  const peptideId = typeof row.peptide_id === "string" ? row.peptide_id.trim() : "";
  const compoundFromCatalog = PEPTIDES.find((p) => p && p.id === peptideId);
  const compoundName =
    (typeof compoundFromCatalog?.name === "string" && compoundFromCatalog.name.trim()) || peptideId || "Compound";
  const label = typeof row.label === "string" ? row.label.trim() : "";
  const vmg = row.vial_size_mg;
  const bml = row.bac_water_ml;
  const conc = row.concentration_mcg_ml;
  const notes = typeof row.notes === "string" && row.notes.trim() ? row.notes.trim() : "";
  const shareNotes =
    row.share_notes_to_network === true ||
    row.share_notes_to_network === "true" ||
    row.share_notes_to_network === 1;
  const photoKey = typeof row.vial_photo_r2_key === "string" ? row.vial_photo_r2_key.trim() : "";
  const status = typeof row.status === "string" ? row.status.trim() : "";
  const recon = typeof row.reconstituted_at === "string" ? row.reconstituted_at : "";
  const vialId = typeof row.vial_id === "string" ? row.vial_id.trim() : "";

  const profileCtx = useContext(ProfileCtx);
  const activeProfileId = profileCtx?.activeProfileId ?? null;
  const activeProfile = profileCtx?.activeProfile ?? null;
  const currentUserId = typeof activeProfile?.user_id === "string" ? activeProfile.user_id : null;
  const currentProfileGoals = activeProfile?.goals ?? null;
  const [likersOpen, setLikersOpen] = useState(false);

  const avatarSrc = buildAvatarUrl(ownerUserId, avatarKey);
  const vialPhotoSrc =
    photoKey && API_WORKER_URL
      ? `${String(API_WORKER_URL).replace(/\/$/, "")}/stack-photo?key=${encodeURIComponent(photoKey)}`
      : null;

  const mgStr = Number.isFinite(Number(vmg)) ? String(vmg) : "—";
  const mlStr = Number.isFinite(Number(bml)) ? String(bml) : "—";
  const concStr = Number.isFinite(Number(conc)) ? String(conc) : "—";

  return (
    <div
      className="pcard"
      style={{
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "'Outfit', sans-serif",
        color: "var(--color-text-primary)",
        borderLeft: `3px solid ${tierAccentCssVar(tier)}`,
        paddingLeft: 12,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              draggable={false}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid var(--color-border-default)",
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            {handle ? (
              <button
                type="button"
                className="mono"
                onClick={(e) => {
                  e.stopPropagation();
                  openPublicMemberProfile(handle);
                }}
                style={{
                  fontSize: 14,
                  color: "var(--color-accent)",
                  marginBottom: 6,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  textDecoration: "underline",
                  textDecorationColor: "var(--color-accent-subtle-50)",
                  textUnderlineOffset: 3,
                }}
              >
                {formatHandleDisplay(handle)}
              </button>
            ) : (
              <div className="mono" style={{ fontSize: 14, color: "var(--color-accent)", marginBottom: 0 }}>
                {displayName}
              </div>
            )}
            {handle ? (
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)" }}>{displayName}</div>
            ) : null}
          </div>
        </div>
        <span className="pepv-emoji" style={{ fontSize: 22, flexShrink: 0 }} title={tier} aria-hidden>
          {networkTierEmoji(tier)}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Shared vial
        </span>
        <span className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          pepguideIQ{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>{score}</span>
        </span>
        {updatedAt ? (
          <span className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {formatTimeAgo(updatedAt)}
          </span>
        ) : null}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)", lineHeight: 1.35 }}>
        {compoundName}
        {label ? (
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 600, fontSize: 15 }}> · {label}</span>
        ) : null}
      </div>

      <div className="mono" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
        {mgStr} mg / {mlStr} mL = {concStr} mcg/mL
      </div>

      {vialPhotoSrc ? (
        <img
          src={vialPhotoSrc}
          alt=""
          loading="lazy"
          style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, border: "1px solid var(--color-border-default)" }}
        />
      ) : null}

      {status ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Status: {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      ) : null}

      {recon ? (
        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Reconstituted {formatTimeAgo(recon)}
        </div>
      ) : null}

      {notes ? (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-primary)",
            lineHeight: 1.45,
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-sunken)",
          }}
        >
          {notes}
        </div>
      ) : null}

      {activeProfileId && ownerUserId && currentUserId === ownerUserId && vialId ? (
        <VialNotesShareToggle
          vialId={vialId}
          userId={ownerUserId}
          profileId={activeProfileId}
          currentUserId={currentUserId}
          ownerUserId={ownerUserId}
          isShared
          currentValue={shareNotes}
          onChange={() => onNotesChanged?.()}
        />
      ) : null}

      <div className="mono" style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
        Educational logging only — not medical advice. Your peptide choices are yours alone.
      </div>

      {postId ? (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 4 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 6, flexWrap: "wrap" }}>
            <LikeButton
              entityType="post"
              entityId={postId}
              currentUserId={currentUserId}
              currentProfileId={activeProfileId}
              currentProfileGoals={currentProfileGoals}
              ownerUserId={ownerUserId || null}
            />
            <LikersRow
              entityType="post"
              entityId={postId}
              currentUserId={currentUserId}
              currentProfileId={activeProfileId}
              currentProfileGoals={currentProfileGoals}
              onOpenModal={() => setLikersOpen(true)}
            />
          </div>
          <CommentsSection
            postId={postId}
            postCommentCount={typeof row.comment_count === "number" ? row.comment_count : Number(row.comment_count) || 0}
            currentUserId={currentUserId}
            currentProfileId={activeProfileId}
            currentProfile={activeProfile}
            currentProfileGoals={currentProfileGoals}
          />
          <LikersModal
            isOpen={likersOpen}
            onClose={() => setLikersOpen(false)}
            entityType="post"
            entityId={postId}
          />
        </div>
      ) : null}
    </div>
  );
}
