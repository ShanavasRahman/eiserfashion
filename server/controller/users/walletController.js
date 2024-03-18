const User = require('../../model/userModel');
const Transaction = require('../../model/transactionModel');

const renderWalletPage = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Find the user and populate the wallet
        const user = await User.findById(userId).populate('wallet');

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find transactions associated with the user
        const transactions = await Transaction.find({ userId: userId });

        // Render the wallet page with wallet and transactions data
        res.render('user/wallet', { wallet: user.wallet, transactions: transactions });
    } catch (error) {
        console.error('Error rendering wallet page:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = renderWalletPage;
