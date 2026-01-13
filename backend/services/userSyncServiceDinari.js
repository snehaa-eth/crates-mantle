
const syncUserWithDinari = async (user , client) => {
    if (!user.entity_id) {
      const dinari_res = await client.v2.entities.create({
        name: user.name,
        reference_id: user._id.toString(),
      });
      user.entity_id = dinari_res.id;
      user.nationality = dinari_res.nationality || null;
      user.is_kyc_complete = dinari_res.is_kyc_complete || false;
    }
  
    if (!user.is_kyc_complete) {
      const dinariRes = await client.v2.entities.retrieveByID(user.entity_id);
      user.is_kyc_complete = dinariRes.is_kyc_complete;
      user.nationality = dinariRes.nationality;
      user.name = dinariRes.name;
    }
  
    if (!user.dinari_account_id) {
      const account = await client.v2.entities.accounts.create(user.entity_id);
      user.dinari_account_id = account.id;
    }
  
    await user.save();
  };
  
  module.exports = { syncUserWithDinari };
  