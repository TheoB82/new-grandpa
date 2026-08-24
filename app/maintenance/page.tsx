export const dynamic = "force-static";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(to bottom, #2a1a0e, #1a0f06)" }}>

      <div className="text-6xl mb-6">👨‍🍳</div>

      <h1 className="text-3xl font-bold text-[#fdd9a1] mb-3">
        Grandpa Tassos Cooking
      </h1>

      <p className="text-[#fdd9a1] text-xl mb-1">
        Θα επιστρέψουμε σύντομα.
      </p>
      <p className="text-[#c9a96e] text-base mb-4">
        We'll be back in just a few days.
      </p>

      <p className="text-[#a07850] text-sm max-w-sm mb-1">
        Η κουζίνα μας βελτιώνεται. Όλες οι συνταγές θα επιστρέψουν σύντομα — σας ευχαριστούμε για την υπομονή σας.
      </p>
      <p className="text-[#7a5c3a] text-xs max-w-sm">
        Our kitchen is being upgraded behind the scenes.
        All recipes will be back soon — thank you for your patience.
      </p>

      <div className="mt-10 text-[#6b4c30] text-xs">
        grandpatassos.cooking
      </div>
    </div>
  );
}
