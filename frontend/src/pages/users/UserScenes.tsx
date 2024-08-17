import { UserFingerprintsList } from "./UserFingerprintsList";

const UserFingerprintsComponent = () => {
  const filter = {
    has_fingerprint_submissions: true,
  };

  return (
    <>
      <h3>My fingerprints</h3>
      <UserFingerprintsList filter={filter} />
    </>
  );
};

export default UserFingerprintsComponent;
