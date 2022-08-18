const Sauce = require('../models/sauce');
const fs = require('fs');


// Route POST de création de sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    usersDisliked: [],
    usersLiked: [],
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Sauce enregistrée !" }))
    .catch((error) => res.status(400).json({ error }));
};

// Route PUT de modification de sauce
exports.modifySauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    const filename = sauce.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      const sauceObject = req.file
        ? {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
              req.file.filename
            }`,
          }
        : { ...req.body };
      Sauce.updateOne(
        { _id: req.params.id },
        { ...sauceObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
        .catch((error) => res.status(400).json({ error }));
    });
  });
};

// Route DELETE de suppression de sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
      .then(sauce => {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
              Sauce.deleteOne({_id: req.params.id})
                  .then(() => res.status(200).json({message: 'Sauce supprimée !'}))
                  .catch(error => res.status(401).json({ error }));
          });
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

// Route GET pour obtenir une sauce en particulier
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
      _id: req.params.id
    }).then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
};

// Route GET pour obtenir l'affichage de toutes les sauces
exports.getAllSauce = (req, res, next) => {
    Sauce.find().then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    )
};



// Route POST pour liker les sauces
exports.likeSauce = (req, res, next) => {
  switch (req.body.like) {
    case 0:
      Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
          if (sauce.usersLiked.find(user => user === req.body.userId)) {
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'Merci pour ton vote !' }); })
              .catch((error) => { res.status(400).json({ error: error }); });

          } if (sauce.usersDisliked.find(user => user === req.body.userId)) {
            Sauce.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'OK' }); })
              .catch((error) => { res.status(400).json({ error: error }); });
          }
        })
        .catch((error) => { res.status(404).json({ error: error }); });
      break;
    //Likes = 1, Mise à jour de la sauce
    case 1:
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Like ajouté !' }); })
        .catch((error) => { res.status(400).json({ error: error }); });
      break;
    //likes = -1, mise à jour de la sauce
    case -1:
      Sauce.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Ton avis a bien été pris en compte' }) })
        .catch((error) => { res.status(400).json({ error: error }) });
      break;
    default:
      console.error('Bad request')
  }
};

