const ExpenseModel = require('../models/ExpenseModel');

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await ExpenseModel.getAll();
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;
        const expense = await ExpenseModel.getById(id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { expense_date, category, description, amount, paid_to, receipt_image } = req.body;
        if (!expense_date || !category || !amount) {
            return res.status(400).json({ message: 'expense_date, category and amount are required' });
        }
        const result = await ExpenseModel.create({ expense_date, category, description, amount, paid_to, receipt_image });
        const newExpense = await ExpenseModel.getById(result.insertId);
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await ExpenseModel.update(id, req.body);
        if (!updated) return res.status(404).json({ message: 'Expense not found' });
        const expense = await ExpenseModel.getById(id);
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await ExpenseModel.delete(id);
        if (!deleted) return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};